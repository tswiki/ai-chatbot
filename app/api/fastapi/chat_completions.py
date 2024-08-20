
import YT_endpts as youtube
import creator_supabase as supabase
import index as vector
import subprocess
import json
import urllib.parse




def semantic_search(query):

    import requests
    import logging

    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

 # Encode the query string
    encoded_query = urllib.parse.quote(query)

    # Construct the URL
    url = f"http://localhost:8000/semanticsearch/{encoded_query}"

    # Set the headers
    headers = {
        "Content-Type": "application/json"
    }

    try:
        # Execute the GET request
        response = requests.get(url, headers=headers)

        # Check if the request was successful
        if response.status_code == 200:
            if response.text:
                try:
                    response_json = response.json()
                    logging.debug("Response: %s", response_json)
                except json.JSONDecodeError as e:
                    logging.error("Failed to parse JSON: %s", e)
                    logging.debug("Raw response: %s", response.text)
            else:
                logging.error("Error: Received empty response from the server.")
        else:
            logging.error("Error: Received status code %d", response.status_code)
            logging.debug("Response content: %s", response.text)
    except requests.RequestException as e:
        logging.error("An error occurred: %s", e)

# Example usage

#query = "what is growth operating"  # Replace with the actual query you want to search
#semantic_search(query)

#semantic_search_endpoint("how much money did mankz make from growth operating?")
#semantic_search("what's the most notable thing that Mankz speaks about?")


def upload_creator_endpoint(creator):

    import requests
    import logging

    # Configure logging
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


    url = "http://localhost:8000/data/"

    params = {
        "creator": creator
    }

    try:
        response = requests.get(url, params=params)

        # Check if the response was successful
        if response.status_code == 200:
            try:
                # Extract the content from the response output
                data = response.json()
                content = data.get("data_result")

                # Check if the content is empty
                if not content:
                    logging.warning("No further data available for indexing regarding this creator/query: %s", creator)
                else:
                    logging.debug("Content: %s", content)

            except ValueError as e:
                logging.error("Error: Could not parse JSON response: %s", e)
        else:
            logging.error("Error: %d - %s", response.status_code, response.text)
    except requests.exceptions.RequestException as e:
        logging.error("Request failed: %s", e)
        

#------------------------------------------------
#add a check for existing creators - done
#------------------------------------------------

#paragraph = "Jake Lazarou, a growth operator that scales businesses"

#upload_creator_endpoint(paragraph)

#paragraph = "Ben Gottfried, An info product growth operator that scales communities through discord"

#paragraph = "Mankz, a growth operator that helps creators make racks"

#paragraph = "Mankz, a growth operator that scales creators and helps them monetise their channel's and audience's to make money"


#paragraph = "Pierre Khoury, a growth operator that scales creators and helps them monetise their channel's and audience's to make money"

#upload_creator_endpoint(paragraph)



#creator_name, creator_description = serv.extract_creator_info(paragraph)
#print(f"Creator Name: {creator_name}")
#print(f"Creator Description: {creator_description}")


#upload_creator_endpoint(creator)


#x = ['UCqECaJ8Gagnn7YCbPEzWH6g', 'Taylor Swift', 'All’s fair in love and poetry... New album THE TORTURED POETS DEPARTMENT. \nOut April 19 🤍\n\n', '59.5M subscribers', ['The Tortured Poets Department: taylor.lnk.to/thetorturedpoetsdepartment', 'taylorswift.com: taylorswift.com', 'Instagram: instagram.com/taylorswift', 'Facebook: facebook.com/TaylorSwift', 'Twitter: twitter.com/taylorswift13', 'TikTok: tiktok.com/@taylorswift', 'Tumblr: taylorswift.tumblr.com'], ['https://yt3.googleusercontent.com/wp-YrJ2bHsq4jKC1CLqzMRmaUhb8Iuk1V1REPTBUwxhchHpPrHCIO27bhQrzFzusHLRarepJQg=s900-c-k-c0x00ffffff-no-rj'], None, False, False, '93,509,249 views', None, 'Joined Sep 20, 2006']
#y = ['UCrJlKsfZLj6ZLYlPwo1uZCw', 'Serge Gatari', "My name is Serge Gatari, founder of Clientacquisition.io  - After spending years going through course after course and not achieving success, I quit my 9 to 5 job in July of 2020 to leave myself no other option but to figure out how to build a successful business. \n\n5 months later, I made my first $10k/m running an appointment setting agency, scaled it to $30k per month 90 days later. In less than a year I was making my yearly salary every month, but I was far from FEELING successful.\n\nI was already stressed at $30k/month so things had to change for me to scale.\n\nInstead of selling services in exchange of a retainer, I started selling Client acquisition infrastructures. I Would Build & Release The Systems & Talent needed for a company to scale & they'd pay me $10k-$20k a pop.\n\nThis offer & model allowed me to hit $600k/month a year later after being stuck at $30k/month.\n\nToday, I teach, consult & partner with Growth Agencies/consultant to implement this model.\n", '32.1K subscribers', ['Get Acess to NBL: book.clientacquisition.io/sales-page-long-page?el=nblchannellink', 'Growth Creator Models: book.clientacquisition.io/growthcreator-3-o-yt', 'Follow Me on Instagram: instagram.com/sergegatari', 'Clientacquisition.io: clientacquisition.io', 'CA.io YouTube Channel: youtube.com/@clientacquisiton.io.?si=T0KAIsuYN6_1DkkV', 'Private NBL Community: book.clientacquisition.io/nbl-subs', 'NBL YouTube Channel: youtube.com/@nblsergegatari?si=dLpAg0BephRh-8N8'], ['https://yt3.googleusercontent.com/MIEK-qnyD5E31lCrywzIzRFLY7TlWhyHKceJFY5Qv2ClscbFTBOHHJn7l9BtIVB8FjFOownGyQ=s900-c-k-c0x00ffffff-no-rj'], None, False, False, '192,571 views', 'Canada', 'Oct 17, 2012']


#print(serv.test_data("UC6kknCvIqVSa9ZHXtpWlEoA"))

# UC6kknCvIqVSa9ZHXtpWlEoA - nik setting
# UCSyF-A_v-vcBH3-wHMLavfQ - pierre


#serv.vectorize_data()
#print(youtube.channel_shorts("UCqECaJ8Gagnn7YCbPEzWH6g"))

#print(serv.index.describe_index_stats())

#print(serv.data("Mankz"))

#youtube.completions

#serge gatari, eric kavelaars, UCHzOkMgP7v3vitwVWAOFJKQ, thomas gonnet , Rob The Bank, luke,belmar, 
# Dylan Wilson, Dan Reeves, Greg Miroslaw, Iman Ghadzi, Eddie Cumberbatch, 
#Samin Yasar, Dan Bagniuk, Jacob Blank, ethan welby, adam walsh, Brett Malinowski
#Toussaint Gilbert, Andrew Yu, Alex Hormozi, Alex Robinson, Neil Patel
#Christian Rodriguez, BAD Marketing, Caffeinated Blogger, UCh2_x_qs0RtNyhl3mPFYSmA

"""

def run_test():
    query = "what's the most notable thing that Mankz speaks about?"
    result = serv.test_semantic_search(query)
    print(result)

# Run the test function
if __name__ == "__main__":
    run_test()

"""

#print(serv.semantic_search_endpoint("what's the most notable thing that Mankz speaks about?"))

#serv.semantic_search("what's the most notable thing that Boyuanism speaks about?")


#print(serv.semantic_search("Mankz"))


#print(serv.index.describe_index_stats())

#print(serv.fetch_stats)

#print(serv.extract_SF_ids(youtube.channel_shorts("UCqECaJ8Gagnn7YCbPEzWH6g")))

#print(youtube.channel_videos("UCqECaJ8Gagnn7YCbPEzWH6g"))


#paragraph = "Ben Gottfried, An info product growth operator that scales communities through discord"

#paragraph = "Mankz, a growth operator that helps creators make racks"

#paragraph = "Pierre Khoury, a growth operator that helps creators monetize"

#creator, desc = serv.extract_creator_info(paragraph)

#channel_id = youtube.search(creator, desc)[0][1]

#print(channel_id)

#UCx7MtSoISCK0SJEyTJKXPMw

#
#video_id = "8SBykQuCWBM"
#supabase.upsert_video_info(video_id, youtube.video_info(video_id))

"""

import requests
#import Favikon_endpts as favikon
import YT_endpts as youtube
import json


def channel_search(creator):
    # Call the Langchain server to get the channel details
    response = requests.post(
        "http://localhost:9000/creatorsearch/invoke",
        json={'input': {'channel_info': json.dumps(youtube.search(creator))}}
    )
    if response.status_code == 200:
        channel_data = json.loads(response.text)
        return channel_data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None
    

def channel_videos(channelId):
    # Call the Langchain server to get the channel details
    response = requests.post(
        "http://localhost:9000/creatorsearch/invoke",
        json={'input': {'creator': json.dumps(youtube.search(channelId))}}
    )
    if response.status_code == 200:
        channel_data = json.loads(response.text)
        return channel_data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def video_details(channelId):
    # Call the Langchain server to get the channel details
    response = requests.post(
        "http://localhost:9000/creatorsearch/invoke",
        json={'input': {'creator': json.dumps(youtube.video_details(channelId))}}
    )
    if response.status_code == 200:
        channel_data = json.loads(response.text)
        return channel_data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None
    
"""

