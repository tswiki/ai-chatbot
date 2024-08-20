from fastapi import FastAPI
from pinecone import Pinecone
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import YT_endpts as youtube
import graphRAG as graph
import creator_supabase as supabase
from fastapi import FastAPI, HTTPException
import logging
import os
import re
import openai
import numpy as np
import uuid
import json
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

pc = Pinecone(os.getenv('PINECONE_API_KEY'))

index = pc.Index("youtube")


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set")


def split_text_into_chunks(text, max_tokens):
    tokens = text.split()
    chunks = []
    current_chunk = []
    current_length = 0

    for token in tokens:
        if current_length + len(token) + 1 <= max_tokens:  # +1 for the space
            current_chunk.append(token)
            current_length += len(token) + 1  # +1 for the space
        else:
            chunks.append(" ".join(current_chunk))
            current_chunk = [token]
            current_length = len(token) + 1  # +1 for the space

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


#vectorize documents
def vectorize_data(documents, expected_dim=1536):

    try:

        embeddings = []
        vector_to_document_map = {}  # Mapping from vector ID to document chunk


        if not documents:  # If documents is an empty list
            print(f"Warning: vectorize_data: {documents} is None or empty - function: vectorize_data")
            return embeddings, vector_to_document_map

        if isinstance(documents, str):  # If input is a single string
            documents = [documents]  # Convert it to a list

        max_tokens = 8192  # Set the maximum context length for the text-embedding-ada-002 model

        for doc in documents:

            if not isinstance(doc, str) or not doc.strip():  # If doc is not a string or is an empty string
                continue  # Skip to the next iteration

            chunks = split_text_into_chunks(doc, max_tokens)

            for chunk in chunks:

                response = openai.embeddings.create(
                    model="text-embedding-ada-002",
                    input=chunk
                )
                
                embedding = response.data[0].embedding

                if len(embedding) == expected_dim:  # Ensure the dimension matches expected_dim
                    embedding_list = [float(x) for x in embedding]  # Convert to list of Python floats
                    vector_id = str(uuid.uuid4())  # Generate a unique ID for the vector
                    embeddings.append((vector_id, embedding_list))  # Store the vector with its ID
                    vector_to_document_map[vector_id] = chunk  # Map the vector ID to the document chunk


            #print("Embeddings:")
            #for vector_id, embedding in embeddings:
                #print(f"Vector ID: {vector_id}, Embedding: {embedding[:5]}...")  # Print first 5 dimensions for brevity

            #print("\nVector to Document Map:")
            #for vector_id, doc_chunk in vector_to_document_map.items():
                #print(f"Vector ID: {vector_id}, Document Chunk: {doc_chunk}")

            # Create the formatted output strings
            embeddings_output = "\nEmbeddings:\n"
            for vector_id, embedding in embeddings:
                embeddings_output += f"Vector ID: {vector_id}, Embedding: {embedding[:5]}...\n"  # Print first 5 dimensions for brevity

            vector_map_output = "\nVector to Document Map:\n"
            for vector_id, doc_chunk in vector_to_document_map.items():
                vector_map_output += f"Vector ID: {vector_id}, Document Chunk: {doc_chunk}\n"

            #print(embeddings_output)
            #print(vector_map_output)

            return embeddings, vector_to_document_map
            
    except Exception as e:
        print(f"Error: {e}")
        return [], {}  # Return an empty list and empty map instead of None


def index_vectors(embeddings, namespace, expected_dim, batch_size=1000):
    if not embeddings:  # Check if embeddings is empty
        print(f"No vectors to upsert for {namespace}")
        return

    index = pc.Index('youtube')
    total_vectors = len(embeddings)

    for i in range(0, total_vectors, batch_size):
        batch_embeddings = embeddings[i:i + batch_size]

        # Extract vector IDs and vectors from the batch
        batch_ids = [vec_id for vec_id, _ in batch_embeddings]
        batch_vectors = [vector for _, vector in batch_embeddings]

        # Ensure vectors are lists of Python floats
        batch_vectors = [[float(x) for x in v] if isinstance(v, (list, np.ndarray)) and len(v) == expected_dim else None for v in batch_vectors]
        batch_vectors = [v for v in batch_vectors if v is not None]  # Remove any None entries

        if len(batch_vectors) != len(batch_ids):
            batch_ids = batch_ids[:len(batch_vectors)]  # Ensure ids match the number of valid vectors

        if batch_vectors:
            # Use zip to create the list of tuples (ID, vector)
            vectors = list(zip(batch_ids, batch_vectors))
            index.upsert(vectors, namespace)
        else:
            print("Warning: batch_vectors is None or empty - function: index_vectors")


def extract_channel_id(json_data):
    # Load the JSON data
    # Regex pattern to match YouTube channel IDs (assuming they start with "UC" and are followed by 22 characters)

    channel_id_pattern = re.compile(r'UC[a-zA-Z0-9_-]{22}')
    data = json_data
    
    # Iterate through the items and search for channel ID
    for item in data.get('search_results', []):
        channel = item.get('channel', {})
        channel_id = channel.get('id', '')
        if channel_id_pattern.match(channel_id):
            return channel_id
    
    return None


#extract video ids from channel
def extract_LF_ids(json_data):

    data = json.dumps(json_data)
    # Regular expression pattern to match video IDs
    pattern = re.compile(r'"id":\s*"([^"]+)"')
    # Find all matches in the JSON string
    video_ids = pattern.findall(data)
    #print(video_ids)

    return video_ids


def extract_SF_ids(json_data):

    data = json.dumps(json_data)
    video_ids = re.findall(r'"video_id": "(\w+)"', data)
    # Print the extracted video IDs
    #print(video_ids)

    return video_ids



def LF_ids(channel_id):

    try:
        # Attempt to extract LF video IDs from YouTube
        try:
            LF_ids = extract_LF_ids(youtube.channel_videos(channel_id))
        except Exception as e:
            print(f"Error extracting LF video IDs from YouTube for channel_id {channel_id}: {e}")
            LF_ids = []

        # Attempt to get unique video IDs from Supabase
        try:
            db_LF, db_SF = supabase.get_unique_video_ids(channel_id)
        except Exception as e:
            print(f"Error fetching unique video IDs from Supabase for channel_id {channel_id}: {e}")
            db_LF, db_SF = [], []

        # Use the database LF video IDs if they are not empty, otherwise use the YouTube LF video IDs
        if db_LF:
            LF_ids = db_LF

        return LF_ids
    
    except Exception as e:
        print(f"An error occurred in LF_ids function for channel_id {channel_id}: {e}")
        return []


def LF_data(channel_id, expected_dim=1536):

    try:

        LF_ids_list = LF_ids(channel_id)

        #print("LF_ids: ", LF_ids)

        LF_data_list = []

        for x in LF_ids_list:

            video_details_synthesis = ""
            vectorize_video_details = []
            vector_to_video_map = {}
            transcript_synthesis = ""
            vectorize_transcript = []
            vector_to_transcript_map = {}
            comments_synthesis = ""
            vectorize_comments = []
            vector_to_comments_map = {}
            video_info = youtube.video_info(x)

            try: 

                video_details = youtube.video_details(x)
                video_details_namespace="video_details"
                video_details_synthesis = youtube.completions(video_details)
                vectorize_video_details, vector_to_video_map = vectorize_data(video_details_synthesis, expected_dim)  # Pass expected_dim to vectorize_data
                        
                if vectorize_video_details:
                            
                    #print(synthesis)
                    index_vectors(vectorize_video_details, video_details_namespace, expected_dim)


            except Exception as e:
                print(f"Error processing video details data for {x}: {e}")
        

            try:

                transcript = youtube.video_transcript(x)  
                transcript_namespace="transcripts"
                transcript_synthesis = youtube.completions(transcript)
                vectorize_transcript, vector_to_transcript_map = vectorize_data(transcript_synthesis, expected_dim)   
            
                if vectorize_transcript:
                    
                    #print(synthesis)
                    index_vectors(vectorize_transcript, transcript_namespace, expected_dim)

            except Exception as e:
                print(f"Error processing video transcript data for {x}: {e}")
        

            try:

                comments = youtube.video_comments(x)
                comments_namespace="comments"
                comments_synthesis = youtube.completions(comments)
                vectorize_comments, vector_to_comments_map = vectorize_data(comments_synthesis, expected_dim)   
            
                if vectorize_comments:
                    
                    #print(synthesis)
                    index_vectors(vectorize_comments, comments_namespace, expected_dim)

            except Exception as e:
                print(f"Error processing video comments data for {x}: {e}")
        

            LF_dict = {
            "channel_id": channel_id,
            "video_id": x,
            "type": "Long Form",
            "namespace": {
                "video_details": {
                    "synthesis": video_details_synthesis,
                    "vectors": vectorize_video_details,
                    "vector_map": vector_to_video_map
                    },
                "transcript": {
                    "synthesis": transcript_synthesis,
                    "vectors": vectorize_transcript,
                    "vector_map": vector_to_transcript_map
                    },
                "comments": {
                    "synthesis": comments_synthesis,
                    "vectors": vectorize_comments,
                    "vector_map": vector_to_comments_map
                    }
                }
            }

            supabase.upsert_channel(channel_id, x, video_details_synthesis, vectorize_video_details, str(vector_to_video_map), transcript_synthesis, vectorize_transcript, str(vector_to_transcript_map), comments_synthesis, vectorize_comments, str(vector_to_comments_map))
            supabase.upsert_video_info(x, video_info)

            LF_data_list.append(LF_dict)

        return LF_data_list

    except Exception as e:
        print(f"Error processing LF_data for {channel_id}: {e}")


def SF_ids(channel_id):

    try:
        # Attempt to extract SF video IDs from YouTube
        try:
            SF_ids = extract_SF_ids(youtube.channel_shorts(channel_id))
        except Exception as e:
            print(f"Error extracting SF video IDs from YouTube for channel_id {channel_id}: {e}")
            SF_ids = []

        # Attempt to get unique video IDs from Supabase
        try:
            db_LF, db_SF = supabase.get_unique_video_ids(channel_id)
        except Exception as e:
            print(f"Error fetching unique video IDs from Supabase for channel_id {channel_id}: {e}")
            db_LF, db_SF = [], []

        # Use the database SF video IDs if they are not empty, otherwise use the YouTube SF video IDs
        if db_SF:
            SF_ids = db_SF

        return SF_ids
    
    except Exception as e:
        print(f"An error occurred in SF_ids function for channel_id {channel_id}: {e}")
        return []


def SF_data(channel_id, expected_dim=1536):

    try:

        SF_ids_list = SF_ids(channel_id)

        SF_data_list = []

        for x in SF_ids_list:

            video_details_synthesis = ""
            vectorize_video_details = []
            vector_to_video_map = {}
            transcript_synthesis = ""
            vectorize_transcript = []
            vector_to_transcript_map = {}
            comments_synthesis = ""
            vectorize_comments = []
            vector_to_comments_map = {}
            video_info = youtube.video_info(x)


            try: 

                video_details = youtube.video_details(x)
                video_details_namespace="video_details"
                video_details_synthesis = youtube.completions(video_details)
                vectorize_video_details, vector_to_video_map = vectorize_data(video_details_synthesis, expected_dim)  # Pass expected_dim to vectorize_data
                        
                if vectorize_video_details:
                            
                    #print(synthesis)
                    index_vectors(vectorize_video_details, video_details_namespace, expected_dim)


            except Exception as e:
                print(f"Error processing video details data for {x}: {e}")
        

            try:
                transcript = youtube.video_transcript(x)   
                transcript_namespace="transcripts"
                transcript_synthesis = youtube.completions(transcript)
                vectorize_transcript, vector_to_transcript_map = vectorize_data(transcript_synthesis, expected_dim)    
            
                if vectorize_transcript:
                    
                    #print(synthesis)
                    index_vectors(vectorize_transcript, transcript_namespace, expected_dim)

            except Exception as e:
                print(f"Error processing video transcript data for {x}: {e}")
        

            try:
                comments = youtube.video_comments(x)
                comments_namespace="comments"
                comments_synthesis = youtube.completions(comments)
                vectorize_comments, vector_to_comments_map = vectorize_data(comments_synthesis, expected_dim)    
            
                if vectorize_comments:
                    
                    #print(synthesis)
                    index_vectors(vectorize_comments, comments_namespace, expected_dim)

            except Exception as e:
                print(f"Error processing video comments data for {x}: {e}")

            SF_dict = {
            "channel_id": channel_id,
            "video_id": x,
            "type": "Short Form",
            "namespace": {
                "video_details": {
                    "synthesis": video_details_synthesis,
                    "vectors": vectorize_video_details,
                    "vector_map": vector_to_video_map
                    },
                "transcript": {
                    "synthesis": transcript_synthesis,
                    "vectors": vectorize_transcript,
                    "vector_map": vector_to_transcript_map
                    },
                "comments": {
                    "synthesis": comments_synthesis,
                    "vectors": vectorize_comments,
                    "vector_map": vector_to_comments_map
                    }
                }
            }

            supabase.upsert_channel(channel_id, x, video_details_synthesis, vectorize_video_details, str(vector_to_video_map), transcript_synthesis, vectorize_transcript, str(vector_to_transcript_map), comments_synthesis, vectorize_comments, str(vector_to_comments_map))           
            supabase.upsert_video_info(x, video_info)

            SF_data_list.append(SF_dict)

        return SF_data_list
    
    except Exception as e:
        print(f"Error processing SF_data for {channel_id}: {e}")


""""

def test_data(channel_id):
    try:
        # Attempt to extract SF video IDs from YouTube
        try:
            SF_ids = extract_SF_ids(youtube.channel_shorts(channel_id))
        except Exception as e:
            print(f"Error extracting SF video IDs from YouTube for channel_id {channel_id}: {e}")
            LF_ids = []

        # Attempt to get unique video IDs from Supabase
        try:
            db_LF, db_SF = supabase.get_unique_video_ids(channel_id)
        except Exception as e:
            print(f"Error fetching unique video IDs from Supabase for channel_id {channel_id}: {e}")
            db_LF, db_SF = [], []

        # Use the database LF video IDs if they are not empty, otherwise use the YouTube LF video IDs
        if db_SF:
            SF_ids = db_SF

        return SF_ids
    
    except Exception as e:
        print(f"An error occurred in test_data function for channel_id {channel_id}: {e}")
        return []

"""   


# Ensure the SpaCy model is installed
def extract_creator_info(paragraph):


    import spacy
    import re

    # Ensure the SpaCy model is installed
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        from spacy.cli import download
        download("en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")

    # Use SpaCy to process the paragraph and find named entities
    doc = nlp(paragraph)
    
    creator_name = None
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            creator_name = ent.text
            break

    # If no PERSON entity is found, try to identify a nickname (heuristic approach)
    if not creator_name:
        # Simple heuristic: assume the first word before a comma or a dash might be a nickname
        match = re.match(r"(\w+)[\s,]+", paragraph)
        if match:
            creator_name = match.group(1)

    if not creator_name:
        return None, None

    # Find the position of the creator's name or nickname in the paragraph
    name_pos = paragraph.find(creator_name)
    
    # Extract the text following the creator's name or nickname
    remaining_text = paragraph[name_pos + len(creator_name):].strip()
    
    # Remove leading punctuation and whitespace
    description = re.sub(r"^[\-,:;\s]+", "", remaining_text).strip()

    return creator_name, description



def channel_data(channel_id, expected_dim=1536):

    try:

        channel_details_list = []

        try:
            # Fetch channel details
            channel_details = youtube.channel_details(channel_id)                
            channel_namespace = "channel_details"
            channel_synthesis = youtube.completions(channel_details)
            vectorized_channel, vector_to_channel_map = vectorize_data(channel_synthesis, expected_dim)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching or processing channel details: {e}")

        try:

            # Extract LF video IDs
            LF_ids = extract_LF_ids(youtube.channel_videos(channel_id))
            LF_vids = ', '.join(LF_ids)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting LF video IDs: {e}")

        try:
            # Extract SF video IDs
            SF_ids = extract_SF_ids(youtube.channel_shorts(channel_id))
            SF_vids = ', '.join(SF_ids)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting SF video IDs: {e}")

        if vectorized_channel:  # Check if vectorized_data is not empty
                
            channel_dict = {

                "channel_id": channel_id,
                "type": "creator youtube channel",
                "namespace": {
                    "channel_synthesis": channel_synthesis, 
                    "vectorized_channel": vectorized_channel,        
                }
            }

            try:

                #only index if channel has not already been indexed
                if not supabase.exists(channel_id):
                    # Index vectors
                    index_vectors(vectorized_channel, channel_namespace, expected_dim)
                    # Upsert creator data into Supabase
                    supabase.upsert_creator(str(channel_id), LF_vids, SF_vids, str(channel_synthesis), vectorized_channel, str(vector_to_channel_map))

                channel_details_list.append(channel_dict)

            except Exception as e:

                raise HTTPException(status_code=500, detail=f"Error indexing vectors or upserting data: {e}")

            return channel_details_list
        
    except Exception as e:
        
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")




def data(creator_paragraph):

    try:
            
        try:

            creator, desc = extract_creator_info(creator_paragraph)

            channel_search_results = youtube.search(creator, desc)

            if not channel_search_results:

                raise ValueError("Channel not found")
            
            channel_id = channel_search_results[0][1]

        except Exception as e:

            raise HTTPException(status_code=404, detail=f"Error searching for channel: {e}")

        # Check if the creator has already been indexed

        indexed = supabase.check_creator_id(channel_id)

        if indexed:

            lf_ids, sf_ids = supabase.get_unique_video_ids(channel_id)

        if lf_ids or sf_ids:

            print("Your channel is currently being indexed. Please be patient, we'll notify you once the process is complete.")

            creator_data = []
            creator_channel = []
            creator_LF = []
            creator_SF = []

            # Fetch channel data

            try:

                exist, vid_ids = supabase.check_creator_id(channel_id)
        
                if exist is False and not vid_ids:

                    channel = channel_data(channel_id)

                    creator_channel.append(channel)


            except Exception as e:

                raise HTTPException(status_code=500, detail=f"Error fetching channel data - data function \'if block\': {e}")

            # Fetch long-form data

            try:

                longform = LF_data(channel_id)

                creator_LF.append(longform)

            except Exception as e:

                raise HTTPException(status_code=500, detail=f"Error fetching long-form data: {e}")

            # Fetch short-form data

            try:

                shortform = SF_data(channel_id)

                creator_SF.append(shortform)

            except Exception as e:

                raise HTTPException(status_code=500, detail=f"Error fetching short-form data: {e}")

            creator_data = creator_channel + creator_LF + creator_SF

            return creator_data
        
        else:

            raise HTTPException(status_code=400, detail="The channel has already been indexed. - data(creator)")
    
    except Exception as e:

        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")



def extract_vectors_from_results(results, include_values=False):
    
    extracted_data = []
    
    for match in results.get('matches', []):
        data = {
            'id': match.get('id'),
            'score': match.get('score')
        }
        if include_values:
            data['values'] = match.get('values', [])
        extracted_data.append(data)
    
    return extracted_data



def retrieve_original_corpus(vectors, vector_to_document_map):
    
    original_corpus = []
    
    for vector in vectors:
        vector_id = vector['id']
        if vector_id in vector_to_document_map:
            original_corpus.append(vector_to_document_map[vector_id])
    
    return original_corpus



async def semantic_search(query):
    
    try:

        import asyncio
        await asyncio.sleep(1)

        # Vectorize the query
        index = pc.Index('youtube')
        
        query_vector, query_vector_map = vectorize_data(query)

        if not query_vector:
            raise ValueError("No embeddings generated for the query")

        query_vector = query_vector[0][1]  # Use the first embedding's vector


        #Ensure the query_vector is correctly formatted as a list of floats
        if not all(isinstance(i, float) for i in query_vector):
            raise ValueError("Query vector is not correctly formatted as a list of floats")

        #Log the query vector
        #print("Query Vector:", query_vector)

        #print(vector)
        # Perform the semantic search using Pinecone
        query_result = index.query(             
            namespace="transcripts", #after test run namespaces will be converted to -> namespace="transcripts"
            vector=query_vector,
            top_k=3, 
            include_metadata=True,
            #include_values=True
            )
        
        supabase.upsert_queries(supabase.format(query), query_vector_map)

        extracted_vectors = extract_vectors_from_results(query_result, include_values=True)

        vector_to_document_map = supabase.document_map()
        
        original_corpus = retrieve_original_corpus(extracted_vectors, vector_to_document_map)

        print("Original Corpus:", original_corpus)

        graph.semantic_rag(query, original_corpus)

        return original_corpus
    

    except Exception as e:
        print(f"Error: {e}")
        return None
    


app = FastAPI(
    
    title="Creator's Library Server",
    version="1.0",
    description="A more complex API server using FASTAPI for added flexibility and functionality",
)


origns = [
    
    "http://localhost:3000/",
    "https://ai-chatbot-eight-ruby.vercel.app/",
    "http://revitalise.io/",
    "http://revitalise.io/app/"
        
        ]

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origns],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

@app.get("/semanticsearch/{query}")
async def semantic_search_endpoint(query: str):
    try:
        
        logging.info(f"Received query: {query}")
        query_result = await semantic_search(query)
        
        if query_result is None:
            logging.warning(f"No results found for query: {query}")
            raise HTTPException(status_code=404, detail="No results found for the query")
        
        return {"query_result": query_result}
    
    except Exception as e:
        logging.error(f"Error during query execution: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")


@app.get("/data/")
async def upload_creator_endpoint(creator: str):
    
    try:

        logging.info(f"Received request for creator: {creator}")
        query_result = data(creator)

        if query_result is None:
            logging.warning(f"No data found for creator: {creator}")
            raise HTTPException(status_code=404, detail="No data found for the provided creator")
        
        logging.info(f"Query successful for creator: {creator}")
        return {"query_result": query_result}
    
    except Exception as e:
        logging.error(f"Error during processing for creator '{creator}': {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", default=8080)))

