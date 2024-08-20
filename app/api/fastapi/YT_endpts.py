import json
import re
import requests
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

def completions(content):

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


#x = ['UCqECaJ8Gagnn7YCbPEzWH6g', 'Taylor Swift', 'All’s fair in love and poetry... New album THE TORTURED POETS DEPARTMENT. \nOut April 19 🤍\n\n', '59.5M subscribers', ['The Tortured Poets Department: taylor.lnk.to/thetorturedpoetsdepartment', 'taylorswift.com: taylorswift.com', 'Instagram: instagram.com/taylorswift', 'Facebook: facebook.com/TaylorSwift', 'Twitter: twitter.com/taylorswift13', 'TikTok: tiktok.com/@taylorswift', 'Tumblr: taylorswift.tumblr.com'], ['https://yt3.googleusercontent.com/wp-YrJ2bHsq4jKC1CLqzMRmaUhb8Iuk1V1REPTBUwxhchHpPrHCIO27bhQrzFzusHLRarepJQg=s900-c-k-c0x00ffffff-no-rj'], None, False, False, '93,814,188 views', None, 'Joined Sep 20, 2006']

#print(completions(x))

#video transcript
def video_transcript(video_id):

    transcript_list = []

    try:
        import requests

        url = "https://youtube-scraper-2023.p.rapidapi.com/video_transcript"

        payload = { "videoId": str(video_id) }
        headers = {
	        "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	        "x-rapidapi-host": "youtube-scraper-2023.p.rapidapi.com",
	        "Content-Type": "application/json"
        }

        response = requests.post(url, json=payload, headers=headers)

        list = response.json()['transcript']

        for item in list:
            transcript_list.append(item['snippet'])

        delimiter = ', '
        transcript = delimiter.join(item for item in transcript_list if item is not None)

        return transcript

    except requests.exceptions.RequestException as e:
        # handle any network or connection errors
        print(f"Error: {e}")
        return None

    except KeyError as e:
        # handle any missing or invalid keys in the response JSON
        print(f"Error: {e}")
        return None

    except TypeError as e:
        # handle any unexpected data types in the response JSON
        print(f"Error: {e}")
        return None

    except Exception as e:
        # handle any other unexpected errors
        print(f"Error: {e}")
        return None


#returns the transcript as a string
#print(video_transcript("XBg9wEbE_5c"))


#video comments
def video_comments(video_id):

    comments_list = []

    try:
        import requests

        url = "https://youtube-media-downloader.p.rapidapi.com/v2/video/comments"

        querystring = {"videoId": str(video_id),"sortBy":"top"}

        headers = {
	        "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	        "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"
        }

        response = requests.get(url, headers=headers, params=querystring)

        list = response.json().get('items')

        if list is not None:
            for item in list:
                comments_list.append(item.get('contentText'))

        return comments_list

    except Exception as e:
        print(f"Error: {e}")
        return []

	
#return a list of comments
#print(video_comments("XBg9wEbE_5c"))




#video details
def video_details(video_id):

    import requests

    url = "https://youtube-scraper-2023.p.rapidapi.com/video_details"

    payload = { "videoId": str(video_id) }
    headers = {
	    "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	    "x-rapidapi-host": "youtube-scraper-2023.p.rapidapi.com",
	    "Content-Type": "multipart/form-data; boundary=---011000010111000001101001"
    }

    response = requests.post(url, json=payload, headers=headers)

    vid_details = response.json()

    vid_details_list = []
    endscreen_list = []

    try:
        vid_details_list.append(vid_details['title'])
    except KeyError:
        print(f"Error processing video title for {video_id}: key 'title' not found")

    try:
        vid_details_list.append(vid_details['id'])
    except KeyError:
        print(f"Error processing video ID for {video_id}: key 'id' not found")

    try:
        vid_details_list.append(vid_details['author'])
    except KeyError:
        print(f"Error processing video author for {video_id}: key 'author' not found")

    try:
        vid_details_list.append(vid_details['thumbnails'][-1]['url']) #highest res thumbnail
    except (KeyError, IndexError):
        print(f"Error processing video thumbnail for {video_id}: key 'thumbnails' not found or no thumbnails available")

    try:
        vid_details_list.append(vid_details['description'])
    except KeyError:
        print(f"Error processing video description for {video_id}: key 'description' not found")

    try:
        vid_details_list.append(vid_details['viewCount'])
    except KeyError:
        print(f"Error processing video view count for {video_id}: key 'viewCount' not found")

    try:
        vid_details_list.append(vid_details['tags']) #list of tags
    except TypeError:
        print(f"Error processing video tags for {video_id}: key 'tags' not found")

    try:
        captions = vid_details['captions']
    except KeyError:
        captions = False

    vid_details_list.append(captions)

    if 'endscreen_elements' in vid_details:
        try:
            for item in vid_details['endscreen_elements']:

                try:
                    endscreen_list.append(item['type']) #type of endpoint
                except KeyError:
                    print(f"Error processing endscreen element type for {video_id}: key 'type' not found")

                try:
                    endscreen_list.append(item['title']) #title of the endpoint
                except KeyError:
                    print(f"Error processing endscreen element title for {video_id}: key 'title' not found")

                try:
                    endscreen_list.append(item['endpoint']) #endpoint links https://youtube.com
                except KeyError:
                    print(f"Error processing endscreen element endpoint for {video_id}: key 'endpoint' not found")

                try:
                    endscreen_list.append(item['metadata']['simpleText']) #endpoint metadata
                except KeyError:
                    print(f"Error processing endscreen element metadata for {video_id}: key 'metadata' or 'simpleText' not found")

                try:
                    endscreen_list.append(item['image']['thumbnails'][-1]['url']) #endpoint visuals
                except (KeyError, IndexError):
                    print(f"Error processing endscreen element image for {video_id}: key 'image' or 'thumbnails' not found or no thumbnails available")

        except TypeError:
            print(f"Error processing endscreen elements for {video_id}: key 'endscreen_elements' not found")

    vid_details_list.append(endscreen_list)

    return vid_details_list


	
#returns a list of video attributes
#print(video_details("8SBykQuCWBM"))


#channel videos
def channel_videos(channel_id):
	import requests

	url = "https://youtube-scraper-2023.p.rapidapi.com/channel_videos"

	payload = {
		"channelId": str(channel_id),
		"nextToken": "",
		"sortBy": ""
	}
	headers = {
	    "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	    "x-rapidapi-host": "youtube-scraper-2023.p.rapidapi.com",
	    "Content-Type": "application/json"
    }

	response = requests.post(url, json=payload, headers=headers)
	return response.json()


#print(channel_videos("UCSyF-A_v-vcBH3-wHMLavfQ"))

#channel details - youtube scraper
def channel_details(channel_id):

	import requests

	url = "https://youtube-v2.p.rapidapi.com/channel/details"

	querystring = {"channel_id": str(channel_id)}

	headers = {
	    "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	    "x-rapidapi-host": "youtube-v2.p.rapidapi.com"
    }

	response = requests.get(url, headers=headers, params=querystring)

	chan_data = response.json()

	chan_data_list = []
	chan_endpts_list = []
	chan_avatar_list = []

	chan_data_list.append(chan_data['channel_id'])
	chan_data_list.append(chan_data['title'])
	chan_data_list.append(chan_data['description'])
	chan_data_list.append(chan_data['subscriber_count'])

	for item in chan_data['links']:
		links = item['name']+": "+item['endpoint']
		chan_endpts_list.append(links)

	chan_data_list.append(chan_endpts_list)

	for item in chan_data['avatar']:
		chan_avatar_list.append(item['url'])
			
	chan_data_list.append(chan_avatar_list)

	chan_data_list.append(chan_data['banner'])
	chan_data_list.append(chan_data['verified'])
	chan_data_list.append(chan_data['has_business_email'])
	chan_data_list.append(chan_data['view_count'])
	chan_data_list.append(chan_data['country'])
	chan_data_list.append(chan_data['creation_date'])

	return chan_data_list

#returns a list of channel attibutes
#print(channel_details("UC6kknCvIqVSa9ZHXtpWlEoA"))


def video_info(video_id):
    import requests

    url = "https://youtube-video-info1.p.rapidapi.com/youtube-info/"
    querystring = {"url": f"https://www.youtube.com/watch?v={video_id}"}

    headers = {
	    "x-rapidapi-key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
	    "x-rapidapi-host": "youtube-video-info1.p.rapidapi.com"
    }

    try:
        response = requests.get(url, headers=headers, params=querystring)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

    try:
        info = response.json()
    except ValueError:
        print("Error: Could not parse JSON response.")
        return None

    video_info_dict = {}

    keys = [
        'id', 'channel_id', 'channel_url', 'duration', 'view_count', 'age_limit',
        'webpage_url', 'categories', 'tags', 'playable_in_embed', 'subtitles',
        'comment_count', 'like_count', 'channel', 'channel_follower_count', 'uploader',
        'uploader_id', 'uploader_url', 'upload_date', 'timestamp', 'availability',
        'extractor', 'fulltitle'
    ]

    for key in keys:
        try:
            video_info_dict[key] = info['info'][key]
        except KeyError:
            print(f"Error: Missing key {key} in JSON response.")
            video_info_dict[key] = None

    return video_info_dict


# Example usage
#video_id = "8SBykQuCWBM"  # Replace with the desired video ID
#video_details = video_info(video_id)
#if video_details:
    #print(video_details)


# Example usage
#print(video_info("epNuCIOWF_M"))










#shorts
def channel_shorts(channel_id):
	import requests

	url = "https://youtube-v2.p.rapidapi.com/channel/shorts"

	querystring = {"channel_id": str(channel_id)}

	headers = {
		"X-RapidAPI-Key": "b22ac7a1e2msh46404df497a44a8p11c439jsn02c64165857a",
		"X-RapidAPI-Host": "youtube-v2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)
	return response.json()

#print(channel_shorts("UCqECaJ8Gagnn7YCbPEzWH6g"))
#-------------------------------------------------------------------------------------------------------------------------------------------


def semantic_similarity(sentence_a, sentence_b):
	try:
		from sentence_transformers import SentenceTransformer, util
	except ImportError:
		print("Error: The 'sentence_transformers' module is not installed. Please install it using 'pip install sentence-transformers'.")
		return

	# Load pre-trained Sentence-BERT model
	model = SentenceTransformer('all-MiniLM-L6-v2')

	# Encode the sentences to get their embeddings
	embedding1 = model.encode(sentence_a, convert_to_tensor=True)
	embedding2 = model.encode(sentence_b, convert_to_tensor=True)

	# Compute cosine similarity between the embeddings
	cosine_similarity = util.pytorch_cos_sim(embedding1, embedding2)
	similarity = cosine_similarity.item()
	#print(f"Cosine Similarity: {cosine_similarity.item()}")
    
	return similarity



def search(search, desc):
    try:
        url = "https://youtube-scraper-2023.p.rapidapi.com/search_video"

        payload = {
            "query": str(search),
            "nextToken": ""
        }
        headers = {
            "content-type": "application/json",
            "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
            "X-RapidAPI-Host": "youtube-scraper-2023.p.rapidapi.com"
        }

        logger.debug(f"Sending request to {url} with payload: {payload} and headers: {headers}")
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        yt_search = response.json().get('search_results', [])

        if not yt_search:
            logger.warning("No search results found.")
            raise HTTPException(status_code=404, detail="No matching channel found")

        max_similarity = 0
        channel = None

        for item in yt_search:
            similarity = semantic_similarity(desc, item['title'])
            if similarity > max_similarity:
                max_similarity = similarity
                channel = item

        if not channel:
            logger.warning("No matching channel found after evaluating search results.")
            raise HTTPException(status_code=404, detail="No matching channel found")

        srch_list = []
        chan_list = []

        chan_list.append(channel['channel']['handle'])
        chan_list.append(channel['channel']['id'])
        chan_list.append(channel['channel']['isVerified'])

        srch_list.append(chan_list)
        srch_list.append(channel['id'])
        srch_list.append(channel['lengthText'])
        srch_list.append(channel['publishedTimeText'])
        srch_list.append(channel['shortViewCountText'])
        srch_list.append(channel['thumbnails'][-1]['url'])
        srch_list.append(channel['title'])
        srch_list.append(channel['url'])
        srch_list.append(channel['viewCountText'])
        
        return srch_list

    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"HTTP error occurred: {e}")
    
    except HTTPException as e:
        # Already an HTTP exception, just log and raise it
        logger.error(f"HTTP Exception: {e.detail}")
        raise  # Reraise the original HTTPException to preserve the status code and message
    
    except Exception as e:
        # Catch any other exceptions and raise a 500 error
        logger.error(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

"""
# Example call for debugging
if __name__ == "__main__":
    try:
        result = search("Taylor Swift", "an artist known for her pop and country music")
        print(result)
    except HTTPException as e:
        logger.error(f"HTTPException caught in main: {e.detail}")
    except Exception as e:
        logger.error(f"Unexpected error caught in main: {e}")
        
"""

#print(search("Taylor Swift", "an artist known for her pop and country music"))



