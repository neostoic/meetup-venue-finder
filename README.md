# Meetup Venue Finder

This is more of a learning project on using [PhantomJS](https://github.com/ariya/phantomjs) for scraping [Foursquare](https://foursquare.com/) locations. The goal is to find good venues for meetups by scraping bars in a neighborhood and outputting their information as CSV, then using that as an input for [Amazon Mechanical Turk](https://www.mturk.com/mturk/welcome) for venue size, reservations, etc.

Keep in mind the scraping of less than 1.000 venues per [Foursquare's terms](https://developer.foursquare.com/overview/venues.html).

## Running the project

1. Install [PhantomJS](http://phantomjs.org/)

  I'm using PhantomJS v2.0.0 for Mac. You might need to install brew and follow the steps [here](http://stackoverflow.com/a/28890209/1144141) to make it work.

2. Run:

  ```sh
  $ phantomjs app.js
  ```

The output will be in the `barOutput` folder.