

"""

def video_detail():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/"

    querystring = {"url":"https://www.tiktok.com/@tiktok/video/7233463396124052782","hd":"1"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def tiktok_trending():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/feed/list"

    querystring = {"region":"us","count":"10"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def user_posts(user_id):

    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/user/posts"

    querystring = {"user_id": str(user_id),"count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())


def user_info():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/user/info"

    querystring = {"user_id":"107955"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())




def user_following():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/user/following"

    querystring = {"user_id":"107955","count":"100","time":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def user_favourites():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/user/favorite"

    querystring = {"user_id":"6741307595983946754","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def user_followers():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/user/followers"

    querystring = {"user_id":"107955","count":"100","time":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def user_comments():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/comment/list"

    querystring = {"url":"https://www.tiktok.com/@tiktok/video/7233463396124052782","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())


def comment_replies():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/comment/reply"

    querystring = {"comment_id":"7093322092531893035","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def challenge_videos():
    
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/challenge/posts"

    querystring = {"challenge_id":"33380","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())


def challenge_details():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/challenge/info"

    querystring = {"challenge_id":"33380"}

    headers = {
    	"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def sound_videos():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/music/posts"

    querystring = {"music_id":"6974398592418809857","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def sound_details():
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/music/info"

    querystring = {"url":"https://www.tiktok.com/music/Bad-Habits-6974398592418809857"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def search_videos():
    
    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/feed/search"

    querystring = {"keywords":"fyp","region":"us","count":"10","cursor":"0","publish_time":"0","sort_type":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def challenge_search():

    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/challenge/search"

    querystring = {"keywords":"cosplay","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def search_user():

    import requests

    url = "https://tiktok-scraper7.p.rapidapi.com/user/search"

    querystring = {"keywords":"tiktok","count":"10","cursor":"0"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())



def video_transcript(video_url):
    
    import requests

    url = "https://tiktok-video-transcript.p.rapidapi.com/transcribe"

    querystring = {"url": video_url,"language":"EN","timestamps":"false"}

    headers = {
	    "X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "X-RapidAPI-Host": "tiktok-video-transcript.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())


"""