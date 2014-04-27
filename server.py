from flask import Flask
from flask import render_template
from twython import Twython
from flask import request
import random

app = Flask(__name__)

@app.route('/')
def start():
    return render_template('index.html')


@app.route('/twittersearch/')
def search():
	APP_KEY = "iN1FY2Z8tnoPATJbUXNwwZsvy"
	APP_SECRET = "j6ozIhNHkwR07kU4vyJtEnsRZATgFONM1grZArY40NacZT1X5B"
	ACCESS_TOKEN = "22043582-t90iAic7BMrtXJx9qsD5mJSHWrJkEcD3GFWaqUkk8"
	ACCESS_SECRET = "QzXytvF9B7wNOVj74Jp4sgERcKOmVonAPOasx8ChaRZC8"

	twitter = Twython(APP_KEY, APP_SECRET, ACCESS_TOKEN, ACCESS_SECRET)
	results = twitter.search(q=request.args.get("q"),geocode=request.args.get("lat")+","+request.args.get("lng")+",1km")
	if(len(results['statuses']) == 0):
		return '{results: "none"}'

	tweet = random.choice(results['statuses'])
	return '{"results": {"text": "' + tweet['text'].replace('"',"'") + '", "coordinates": ['+ str(tweet['coordinates']['coordinates'][1]) +',' + str(tweet['coordinates']['coordinates'][0]) +']}}'

if __name__ == '__main__':
    app.debug = True
    app.run(port=8000)