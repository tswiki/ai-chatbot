
import json
import re
import requests
import index as vector
import creator_supabase as supabase
#from graphrag_sdk import KnowledgeGraph
import logging


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_cypher_query(g, q):
    return g.query(q).result_set


def generate_schema(content):
    try:
        # Convert content to a single string
        data = ' '.join(str(item) for item in content)

        # API details
        url = "https://gpt-4o.p.rapidapi.com/chat/completions"
        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": data
                }
            ]
        }
        headers = {
            "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
            "x-rapidapi-host": "gpt-4o.p.rapidapi.com",
            "Content-Type": "application/json"
        }

        # Send the request
        response = requests.post(url, json=payload, headers=headers)

        # Check for HTTP errors
        response.raise_for_status()

        # Process the response
        choices = response.json().get('choices', [])

        for item in choices:
            content = item.get('message', {}).get('content', '')

            if content:
                # Regular expression to match the schema in the text
                schema_regex = r"(\{[\s\S]*\})"

                
                # Find the schema in the text
                schema_match = re.search(schema_regex, content)

                # Extract the schema if found
                extracted_schema = schema_match.group(0) if schema_match else None

                # If no schema was extracted, log a warning and continue
                if not extracted_schema:
                    logger.warning("No schema found in the extracted content.")
                    continue

                try:
                    json_schema = json.loads(extracted_schema)
                    schema = json.dumps(json_schema)

                    #return version, schema
                    return schema
                
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON: {e}")
                    return None

        # If no schema was found or the response was empty
        logger.warning("No schema found in the response.")
        return None

    except requests.exceptions.RequestException as e:
        # Log any request-related errors
        logger.error(f"Request failed: {e}")
        return None

    except re.error as e:
        # Log any regex-related errors
        logger.error(f"Regex failed: {e}")
        return None

    except KeyError as e:
        # Log errors related to missing keys in the response JSON
        logger.error(f"Key error: {e}")
        return None

    except Exception as e:
        # Log any other errors
        logger.error(f"An unexpected error occurred: {e}")
        return None
        


def generate_schema(content):

        # Convert content to a single string
        data = ' '.join(str(item) for item in content)

        # API details
        url = "https://gpt-4o.p.rapidapi.com/chat/completions"
        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": data
                }
            ]
        }
        headers = {
            "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
            "x-rapidapi-host": "gpt-4o.p.rapidapi.com",
            "Content-Type": "application/json"
        }

        # Send the request
        response = requests.post(url, json=payload, headers=headers)

        # Check for HTTP errors
        response.raise_for_status()

        # Process the response
        choices = response.json().get('choices', [])

        for item in choices:
            content = item.get('message', {}).get('content', '')
            return content
            



def unschema(query, vectorRAG, version, schema):  
    
    prompt = "Use this information in the context of creating a more consistent and robust social network around it, the primary focus is to understand how users are interactng with the information and how the presented information better enables their creativity and resourcefulness around problem solving as opposed to just content of the information itself (without making it overly specific and edge case focused):\n"

    prompt+= "\nIdentify the key themes, topics, ideas, what the questions (statements) behind the question (statement) is/are and how their consistency and presence better enables the user to solve their problems\n"

    prompt+= "\nContext:\n"

    prompt+= f"\nUser query: \"{query}\"\n"

    prompt+=f"\System answer: \"{vectorRAG}\"\n"

    prompt+="\n,to generate an \"entities\", \"attributes\" and \"relations\" graphRAG schema (that abstracts parts of the schema that are less likely to reoccur (could be classified as edge cases when dealing with digital creators) when more information needs to be indexed), information should be returned in the following schema outline in the context of the provided user information while ensuring that it builds on the existing concepts of the graphRAG schema, this change should reflect the updates accordingly via the semantic version provided:\n"

    prompt+="\nBasic schema outline:\n"

    prompt+="\n\"Schema: \n\n\t{\"entities\": \n\t\t\t[],\n\t\"relations\": \n\t\t\t[]\"}\n"

    prompt+="\nMost recent schema version:\n"

    prompt+=f"\n\"{schema}\"\n"

    prompt+= """\n

    Schema: {"entities": [{"name": "Actor", "attributes": [
        {"name": "Name", "type": "str", "desc": "Actor's Name", "unique": true}]},
        {"name": "Critic", "attributes": [
        {"name": "TopCritic", "type": "bool", "desc": "Critic's TopCritic", "unique": false},
        {"name": "Name", "type": "str", "desc": "Critic's Name", "unique": true},
        {"name": "Publication", "type": "str", "desc": "Critic's Publication", "unique": false}]}...
    
    \n"""

    prompt+="Product versioning: \n"

    prompt+=f"\nInitial version: {version}\n"

    return prompt
    


async def semantic_rag(query, vectorRAG):

    current_version, current_schema = supabase.semantic_versioning()

    updated_version, updated_schema = generate_schema(unschema(query, vectorRAG, current_version, current_schema))

    supabase.upsert_graph_rag(updated_version, updated_schema)
    

    #index into graphbase
    #query graphbase


    print(f"Schema: {updated_schema}")



def cypher_query(content):

    import requests

    data = ' '.join(str(item) for item in content)

    url = "https://gpt-4o.p.rapidapi.com/chat/completions"

    payload = {
	    "model": "gpt-4o",
	    "messages": [
		    {
			    "role": "user",
			    "content": "Use this information to provide a detailed synopsis and overview of what it represents, ensuring to include relevant metrics and analytics to state points, provide evidence for them, explain them and then link them to the context of the rest of the data: " + data

		    }
	    ]
    }
    headers = {
	"x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	"x-rapidapi-host": "gpt-4o.p.rapidapi.com",
	"Content-Type": "application/json"
	}

    response = requests.post(url, json=payload, headers=headers)

    choices = response.json()['choices']

    for item in choices:
        
        return (item['message']['content'])




def query(kg, question:str, messages:list, model="gpt-4-1106-preview") -> str:
    # Build system message
    if len(messages) == 0:
        # graph schema
        schema_desc = _graph_schema_to_prompt(kg.schema)
        messages.append(
            {"role": "system", "content": f"""You are a graph database expert fluent in the Cypher query language
                with access to the following knowledge graph: {schema_desc}"""})

    # Get an answer
    answer = run_conversation(kg.graph, question, messages, model)

    # Append answer to conversation
    messages.append({"role": "assistant", "content": answer})

    return answer


