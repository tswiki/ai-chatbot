
from supabase import create_client, Client
from supabase.client import ClientOptions
import json
from datetime import datetime as dt
from supabase._sync.client import SupabaseException
from dotenv import load_dotenv
import os
import ast
import json

load_dotenv()

url: str = os.environ.get('SUPABASE_URL')
key: str = os.environ.get('SUPABASE_KEY')

if not url or not key:
    raise SupabaseException("supabase_url and supabase_key are required")


def datetime_converter(o):
    if isinstance(o, dt):
        return o.isoformat()  # or you can use str(o)
    raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")


#Supabase 'json' field compatable
def format(json_data):
    
    format1 = json.dumps(json_data.replace("'", '"'))
    format2 = format1.replace("None", "null")
    format3 = format2.replace("False", "false")

    return format3


supabase: Client = create_client(url, key,
    options=ClientOptions(
    postgrest_client_timeout=10,
    storage_client_timeout=10,
    schema="public",

  )
)

#upserting data rows to supabase
def upsert_creator(channel_id, LF_video_list, SF_video_list, channel_synthesis, vectorize_channel, vector_channel_map):

    # Convert data to JSON string using the custom converter
    json_data = json.dumps(dt.now(), default=datetime_converter)
    # Convert JSON string back to a dictionary
    time = json.loads(json_data)

    response = (
        supabase.table("creator_data")
        .upsert({"created_at": time, "channel_id": str(channel_id), "LF_video_list": str(LF_video_list), "SF_video_list": str(SF_video_list), "channel_synthesis": str(channel_synthesis), "vectorize_channel": str(vectorize_channel), "vector_to_channel_map": str(vector_channel_map)})
        .execute()
        )
    return response


def upsert_channel(channel_id, video_id, video_details, vectorized_video_details, vector_video_map, transcript, vectorized_transcript, vector_transcript_map, comments, vectorized_comments, vector_comments_map):

    # Convert data to JSON string using the custom converter
    json_data = json.dumps(dt.now(), default=datetime_converter)
    # Convert JSON string back to a dictionary
    time = json.loads(json_data)

    response = (
        supabase.table("channel_data")
        .upsert({"channel_id": str(channel_id), "created_at": time, "video_id": str(video_id), "video_details": str(video_details), "vectorized_video_details": str(vectorized_video_details), "vector_to_video_map": str(vector_video_map), "transcript": str(transcript), "vectorized_transcript": str(vectorized_transcript), "vector_to_transcript_map": str(vector_transcript_map), "comments": str(comments), "vectorized_comments": str(vectorized_comments), "vector_to_comments_map": str(vector_comments_map)})
        .execute()
        )
    
    return response


def upsert_video_info(video_id, vid_info):

    # Convert data to JSON string using the custom converter
    json_data = json.dumps(dt.now(), default=datetime_converter)
    # Convert JSON string back to a dictionary
    time = json.loads(json_data)

    response = (
        supabase.table("video_info")
        .upsert({"video_id": str(video_id), "created_at": time, "vid_info": str(vid_info)})
        .execute()
        )
    
    return response


def upsert_graph_rag(version, schema):

    # Convert data to JSON string using the custom converter
    json_data = json.dumps(dt.now(), default=datetime_converter)
    # Convert JSON string back to a dictionary
    time = json.loads(json_data)

    response = (
        supabase.table("graph_rag")
        .upsert({"version": str(version), "created_at": time, "schema": str(schema)})
        .execute()
        )
    
    return response





def upsert_queries(query, query_map):

     # Convert data to JSON string using the custom converter
    json_data = json.dumps(dt.now(), default=datetime_converter)
    # Convert JSON string back to a dictionary
    time = json.loads(json_data)

    response = (
        supabase.table("creator_queries")
        .upsert({"created_at": time, "query": str(query), "query_map": str(query_map)})
        .execute()
    )
    return response


def document_map():
    try:
        # Perform the query using the select method
        response = (
            supabase
            .from_('channel_data')
            .select('vector_to_video_map, vector_to_transcript_map, vector_to_comments_map, creator_data(vector_to_channel_map)')
            .execute()
        )

        vector_to_document_map = {}

        for item in response.data:
            try:
                # Parse the vector_to_channel_map
                channel_map = ast.literal_eval(item["creator_data"]["vector_to_channel_map"])
                vector_to_document_map.update(channel_map)

                # Parse the vector_to_video_map
                video_map = ast.literal_eval(item["vector_to_video_map"])
                vector_to_document_map.update(video_map)

                # Parse the vector_to_transcript_map
                transcript_map = ast.literal_eval(item["vector_to_transcript_map"])
                vector_to_document_map.update(transcript_map)

                # Parse the vector_to_comments_map
                comments_map = ast.literal_eval(item["vector_to_comments_map"])
                vector_to_document_map.update(comments_map)

            except Exception as e:
                print(f"Error processing item: {item}, Error: {e}")

        return vector_to_document_map

    except Exception as e:
        print(f"Error: {e}")


#print(document_map())
#create a table for channel_data
#create a table for LF & SF details

def check_creator_id(channel_id: str):

    """
    Check if all the video_ids in the LF_video_list and SF_video_list columns in the creator_data table 
    have corresponding values in the channel_data and video_info tables.

    Args:
        channel_id (str): The ID of the channel to check.

    Returns:
        bool: True if all video IDs have corresponding entries, False otherwise.
        list: List of video IDs that do not have corresponding entries in the required tables.
    """

    missing_video_ids = []

    try:
        # Fetch the LF_video_list and SF_video_list for the given channel_id
        response = supabase.from_("creator_data").select("LF_video_list, SF_video_list").eq("channel_id", channel_id).execute()

        if response.data is None or len(response.data) == 0:
            error_message = f"No data found for channel_id: {channel_id} in creator_data table."
            print(error_message)
            return False, missing_video_ids

        data = response.data[0]

        # Split LF_video_list and SF_video_list into separate lists
        lf_video_list = data['LF_video_list'].split(',') if 'LF_video_list' in data and data['LF_video_list'] else []
        sf_video_list = data['SF_video_list'].split(',') if 'SF_video_list' in data and data['SF_video_list'] else []

        # Combine LF and SF video lists
        all_video_ids = set(lf_video_list + sf_video_list)

        # Check if each video ID has corresponding entries in channel_data and video_info
        for video_id in all_video_ids:
            
            video_id = video_id.strip()

            # Check channel_data table
            channel_data_response = supabase.from_("channel_data").select("video_id").eq("video_id", video_id).execute()
            
            if channel_data_response.data is None or len(channel_data_response.data) == 0:
                error_message = f"Video ID {video_id} not found in channel_data table."
                #print(error_message)
                missing_video_ids.append(video_id)
                continue

            # Check video_info table
            video_info_response = supabase.from_("video_info").select("video_id").eq("video_id", video_id).execute()
            
            if video_info_response.data is None or len(video_info_response.data) == 0:
                error_message = f"Video ID {video_id} not found in video_info table."
                #print(error_message)
                missing_video_ids.append(video_id)

        if missing_video_ids:
            return False, missing_video_ids

        return True, []
    
    except Exception as e:

        error_message = f"An error occurred while checking video IDs for channel_id {channel_id}: {e}"
        
        print(error_message)

        return False, missing_video_ids

# False - creator not properly indexed, returns list of vid ids that aren't indexed
# False - creator not indexed at all, returns empty list

#print(check_creator_id("UCSyF-A_v-vcBH3-wHMLavfQ"))
#UCiFpRtZdrPZmcFVt3KYcXBA - ethan welby



def semantic_versioning():

    import logging

    # Configure logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)

    try:
        # Attempt to retrieve the most recent version
        logger.debug("Attempting to retrieve the most recent semantic version.")
        
        response = supabase.from_("graph_rag").select("version").order('created_at', desc=True).limit(1).execute()
        
        # Check if the response is valid and contains data
        if response.data and len(response.data) > 0:
            # Fetch the version string from the response
            most_recent_version = response.data[0]['version']
            logger.debug(f"Most recent version retrieved: {most_recent_version}")
            
            schema = supabase.from_("graph_rag").select("schema").eq("version", most_recent_version).execute()

            return most_recent_version, schema
        
        else:
            logger.warning("No data found in the response. Returning None.")
            return None

    except KeyError as e:
        logger.error(f"KeyError: {e}. The 'version' key might be missing in the response data.")
        return None

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        return None



# Function to retrieve video IDs not present in channel_data
def get_unique_video_ids(channel_id):
    
    try:
        # Fetch the LF_video_list and SF_video_list for the given channel_id
        response = supabase.from_("creator_data").select("LF_video_list, SF_video_list").eq("channel_id", channel_id).execute()

        if response.data is None or len(response.data) == 0:
            print(f"No data found for channel_id: {channel_id}")
            return [], []

        data = response.data[0]

        # Split LF_video_list and SF_video_list into separate lists
        lf_video_list = data['LF_video_list'].split(',') if 'LF_video_list' in data and data['LF_video_list'] else []
        sf_video_list = data['SF_video_list'].split(',') if 'SF_video_list' in data and data['SF_video_list'] else []

        # Fetch existing video IDs from the channel_data table
        channel_data_response = supabase.from_("channel_data").select("video_id").eq("channel_id", channel_id).execute()

        if channel_data_response.data is None or len(channel_data_response.data) == 0:
            print(f"No video data found in channel_data for channel_id: {channel_id}")
            existing_video_ids = set()
        else:
            existing_video_ids = {record['video_id'] for record in channel_data_response.data}

        # Filter out video IDs that are already in the channel_data table
        unique_lf_video_ids = [video_id.strip() for video_id in lf_video_list if video_id.strip() not in existing_video_ids]
        unique_sf_video_ids = [video_id.strip() for video_id in sf_video_list if video_id.strip() not in existing_video_ids]

        
        return unique_lf_video_ids, unique_sf_video_ids
    except Exception as e:
        print(f"An error occurred while fetching video IDs from Supabase: {e}")
        return [], []


# Example usage
#channel_id = 'UCSyF-A_v-vcBH3-wHMLavfQ'  # Replace with the desired channel ID
#unique_lf_video_ids, unique_sf_video_ids = get_unique_video_ids(channel_id)
#print(f"Unique LF Video IDs for channel {channel_id}: {unique_lf_video_ids}")
#print(f"Unique SF Video IDs for channel {channel_id}: {unique_sf_video_ids}")

#x, y = get_unique_video_ids("UCSyF-A_v-vcBH3-wHMLavfQ")
#print(x)
#print(y)


def exists(channel_id):

    # Query the creator_data table to get the channel data
    response = supabase.from_('creator_data').select('channel_id').eq("channel_id", channel_id).execute()

    # Check if the query was successful
    exist = response.data

    return exist

# UCSyF-A_v-vcBH3-wHMLavfQ - pierre
# UCiFpRtZdrPZmcFVt3KYcXBA - ethan welby

#if not exists("UCSyF-A_v-vcBH3-wHMLavfQ"):
#    print("not indexed")
#print("....")