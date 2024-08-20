
#Favikon API

import requests
from json import JSONDecodeError  # import JSONDecodeError from the json module

def search(username):
    url = f"https://api.favikon.com/api/influencer/{username}"

    headers = {
        'Content-Type': 'application/json',
        'Cookie': 'express:sess=eyJwYXNzcG9ydCI6eyJ1c2VyIjoiNjY2MzNmMmIwYWU1MzIwMjA0MmM1ZTI4In19; express:sess.sig=Jks7WPzlclakAW2Cdpu35OCdnOI'
    }

    response = requests.get(url, headers=headers)

    try:
        return response.json()
    except JSONDecodeError:  # catch JSONDecodeError
        print(f"Error: Unable to parse JSON response for user '{username}'")
        return None

# Print the response content
print(search("demilovato"))



#website html scraper
def site_scraper(url):

    import requests

    api_url = "https://nimble-scraper.p.rapidapi.com/"

    querystring = {"url": str(url)}

    headers = {
        "x-rapidapi-key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
        "x-rapidapi-host": "nimble-scraper.p.rapidapi.com"
    }

    response = requests.get(api_url, headers=headers, params=querystring)
    return response.json()


#print(site_scraper("https://www.demilovato.com/#/"))




#social media scraper - extracts all socials but not emails & phone numbers
def socials_scraper(url):

    import requests

    url = "https://webpage-contacts-and-social-profiles-scraper.p.rapidapi.com/contacts"

    querystring = {"url": str(url)}

    headers = {
	    "x-rapidapi-key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "x-rapidapi-host": "webpage-contacts-and-social-profiles-scraper.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)
    return response.json()

#print(socials_scraper("https://www.demilovato.com"))





#all the links across the website and webpages
def links_scraper(url):
    import requests

    url = "https://website-contact-scraper.p.rapidapi.com/"

    querystring = {"url": str(url)}

    headers = {
	    "x-rapidapi-key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "x-rapidapi-host": "website-contact-scraper.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)
    return response.json()





#all relevant links & contact data excluding youtube
def contact_scraper():
    import requests

    url = "https://website-social-scraper-api.p.rapidapi.com/contacts/"

    querystring = {"website": "https://www.demilovato.com"}

    headers = {
	    "x-rapidapi-key": "c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd",
	    "x-rapidapi-host": "website-social-scraper-api.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)
    return response.json()

