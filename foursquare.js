var page = require('webpage').create();
var screenshotNum = 1;
var screenshotPath = 'screenshots/foursquare';
var userInformation = {};
var searchForUserInformation = false;

page.onConsoleMessage = function(msg) {
  // Don't print Foursquare's developer console warning
  if (!msg.match('The JavaScript console is intended for developers') &&
      !msg.match('Stop!') &&
      !msg.match('For more information')) { 
     console.log(msg);
   }
};

// Open foursquare login page
page.open('https://foursquare.com/login?continue=%2F&clicked=true');
do { phantom.page.sendEvent('mousemove'); } while (page.loading);
console.log('Foursquare loaded!');
page.render(screenshotPath + screenshotNum++ + '.png');

if(searchForUserInformation) {
  // Fill out login fields and submit it
  page.evaluate(function() {
    var EMAIL_ADDRESS = 'YOUR_EMAIL_ADDRESS';
    var PASSWORD = 'YOUR_PASSWORD';
    
    document.getElementById('username').value = EMAIL_ADDRESS;
    document.getElementById('password').value = PASSWORD;
    document.getElementById('loginFormButton').click();
  });
  do { phantom.page.sendEvent('mousemove'); } while (page.loading);
  console.log('Logged in!');
  page.render(screenshotPath + screenshotNum++ + '.png');

  // Head to account information
  page.evaluate(function() {
    var ev = document.createEvent('MouseEvents');
    ev.initEvent('click', true, true);
    var element = document.querySelector('.userPathLink');
    element.dispatchEvent(ev);
  });
  do { phantom.page.sendEvent('mousemove'); } while (page.evaluate(function() { 
    var isVisible = document.getElementById('userInfo');
    if(isVisible) return false;
    else return true;
  }));
  console.log('Account information loaded!');

  // Get user account information
  page.evaluate(function() {
    var userInformation = {};
    userInformation.name = document.querySelector('.name').innerText;
    userInformation.location = document.querySelector('#userDetails .location').innerText;
    
    // Get social media information
    if (document.querySelector('.fbLink')) {
      userInformation.facebookUrl = document.querySelector('.fbLink').href;
    }
    if (document.querySelector('.twLink')) {
      userInformation.twitterUrl = document.querySelector('.twLink').href;
    }
  });
  page.render(screenshotPath + screenshotNum++ + '.png');
}

// Fill out search for bars in neighborhood
page.evaluate(function() {
  document.getElementById('headerBarSearch').value = 'bar';
  document.getElementById('headerLocationInput').value = 'Logan Square';
  document.querySelector('.submitButton').click();
});
do { phantom.page.sendEvent('mousemove'); } while (page.evaluate(function() { 
  var isVisible = document.getElementById('resultsContainer');
  if(isVisible) return false;
  else return true;
}));
console.log('Search finished!');
page.render(screenshotPath + screenshotNum++ + '.png');

//TODO: Get list of bars
page.evaluate(function() {
  // Head to bar page
  var ev = document.createEvent('MouseEvents');
  ev.initEvent('click', true, true);
  var element = document.querySelector('.venueName h2 a');
  
  // Remove target=_blank from link
  element.removeAttribute('target');
  
  element.dispatchEvent(ev);
});
do { phantom.page.sendEvent('mousemove'); } while (page.evaluate(function() { 
  var isVisible = document.getElementById('actionBar');
  if(isVisible) return false;
  else return true;
}));
console.log('Opened bar page!');
page.render(screenshotPath + screenshotNum++ + '.png');

// Save bar information
page.evaluate(function() {
  var barInformation = {};
  barInformation.name = document.querySelector('.venueName').innerText;
  barInformation.address = document.querySelector('.adr').innerText;
  barInformation.telephone = document.querySelector('.tel').innerText;
  barInformation.price = document.querySelector('[itemprop=priceRange]').innerText.replace(/\s+/g, '');
  barInformation.website = document.querySelector('.url').href;
  
  // Outdoor seating has no ID's or specific classes
  var venueSecondaryAttr = document.querySelectorAll('.venueAttr, .secondaryAttr');
  for (i = 0; i < venueSecondaryAttr.length; ++i) {
    var attrKey = venueSecondaryAttr[i].firstElementChild.innerText;
    if(attrKey.match('Outdoor Seating')) {
      barInformation.outdoorSeating = venueSecondaryAttr[i].lastElementChild.innerText;
    }
  }
  
  // Get list of reviews
  var reviewsList = document.getElementById('tipsList').children;
  for (var j = 0; j < reviewsList.length; ++j) {
    var tipContents = reviewsList[j].lastElementChild.children;
    barInformation.reviews = [];
    var barReview = {};
    barReview.text = tipContents[0].innerText;
    barReview.date = tipContents[1].children[1].innerText;
    barInformation.reviews.push(barReview);
  }
});


phantom.exit();