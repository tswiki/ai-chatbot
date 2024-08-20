
#User profile
"""
#profile info
def profile_info(user):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/info"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


################################################################################################################
#followers - 1000 at a time - pagination

import requests

url = "https://instagram-scraper-api2.p.rapidapi.com/v1/followers"

querystring = {"username_or_id_or_url":"mrbeast"}

headers = {
	"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
}

response = requests.get(url, headers=headers, params=querystring)

print(response.json())


#following - 1000 at a time - pagination

def user_following(user):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/following"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#posts & reels - 12 at a time - pagination

def user_posts():

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"

	querystring = {"username_or_id_or_url":"mrbeast"}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#reels - 12 at a time

import requests

url = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"

querystring = {"username_or_id_or_url":"mrbeast"}

headers = {
	"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
}

response = requests.get(url, headers=headers, params=querystring)

print(response.json())


#tagged posts - 12 at a time

import requests

url = "https://instagram-scraper-api2.p.rapidapi.com/v1/tagged"

querystring = {"username_or_id_or_url":"mrbeast"}

headers = {
	"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
}

response = requests.get(url, headers=headers, params=querystring)

print(response.json())



####################################################################################################################

#stories

def user_stories(user):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/stories"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#highlights
def user_highlights(user):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/highlights"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#IG TV posts
def user_tv_posts(user):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/tv_posts"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#IG guides
def user_guides(user):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/guides"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()




#Post details

#info

def user_post_info(post):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/post_info"

	querystring = {"code_or_id_or_url": str(post),"include_insights":"true"}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#highlights info

def user_highlight_info(highlight):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/highlight_info"

	querystring = {"highlight_id": str(highlight)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#likes

def post_likes(post):
	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/likes"

	querystring = {"code_or_id_or_url": str(post)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()



#comments

def post_comments(post):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/comments"

	querystring = {"code_or_id_or_url": str(post)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()



#comments thread

def post_comments_thread(comment_id):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/comments_thread"

	querystring = {"code_or_id_or_url":"C3OqtMeRxrV","comment_id": str(comment_id)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	print(response.json())




#search users

def search_users(user):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/search_users"

	querystring = {"search_query": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#search hashtags

def search_hashtags(user):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/search_hashtags"

	querystring = {"search_query": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()



#similar accounts

def similar_accounts(user):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/similar_accounts"

	querystring = {"username_or_id_or_url": str(user)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()



#hashtags posts & reels

def hashtag_posts(hashtag):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag"

	querystring = {"hashtag": str(hashtag)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


#audio info

def audio_info(audio_id):

	import requests

	url = "https://instagram-scraper-api2.p.rapidapi.com/v1/audio_info"

	querystring = {"audio_canonical_id": str(audio_id)}

	headers = {
		"X-RapidAPI-Key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
		"X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
	}

	response = requests.get(url, headers=headers, params=querystring)

	return response.json()


"""