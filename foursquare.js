var page = require('webpage').create();
var screenshotNum = 1;
var screenshotPath = 'screenshots/foursquare';
var userInformation = {};
var searchForUserInformation = false;
var Papa = require('./babyparse.js');

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

// Click on 'See more results' button to get full list
while(page.evaluate(function() { 
        return $(".blueButton").is(":visible");
      })) {
  phantom.page.sendEvent('mousemove');
  
  // Only click on button if page isn't loading
  page.evaluate(function() { 
    if (!$("#loadingResults").is(":visible") && $(".blueButton").is(":visible")) {
      var ev = document.createEvent('MouseEvents');
      ev.initEvent('click', true, true);
      var element = document.querySelector('.blueButton');
      console.log('clicking on element: ' + element);
      element.dispatchEvent(ev);
    }
  });
}
// Make sure that all bars finished loading
do { phantom.page.sendEvent('mousemove'); } while (page.evaluate(function() { 
  if (!$("#loadingResults").is(":visible") && !$(".blueButton").is(":visible")) {
    return false;
  }
  return true;
}));
page.render(screenshotPath + screenshotNum++ + '.png');

// Get list of bars
var barList = page.evaluate(function() {
  var venueElements = document.querySelectorAll('.venueName h2 a');
  console.log('venue list size: ' + venueElements.length);
  var barLinkList = [];
  for (var i = 0; i < venueElements.length; ++i) {
    barLinkList.push(venueElements[i].href);
  }
  return barLinkList;
});

var barListInformation = [];
for (var i = 0; i < barList.length; i++) {
  barListInformation.push(getBarInformation(barList[i]));
}
function getBarInformation(barUrl) {
  console.log('Getting information for: ' + barUrl + '\n');
  // Open bar page
  page.open(barUrl);
  do { phantom.page.sendEvent('mousemove'); } while (page.loading || page.evaluate(function() { 
    var isVisible = document.getElementById('actionBar');
    if(isVisible) return false;
    else return true;
  }));
  console.log('Bar page loaded!');
  page.render(screenshotPath + screenshotNum++ + '.png');
  
  // Save bar information
  var barInformation = page.evaluate(function() {
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
    barInformation.reviews = {};
    for (var j = 0; j < reviewsList.length; ++j) {
      var tipContents = reviewsList[j].lastElementChild.children;
      var barReview = {};
      barReview.text = tipContents[0].innerText.toString();
      barReview.date = tipContents[1].children[1].innerText.toString();
      barInformation.reviews['review' + j] = barReview;
    }
    return barInformation;
  });
  return barInformation;
}

// Convert bars information to JSON
var jsonObject = JSON.stringify(barListInformation);
console.log('stringified JSON:\n');
console.log(jsonObject);

JSON.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i = 0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop + "[" + i + "]");
            if (l === 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
};
var flattenObject = [];
barListInformation.forEach(function(barInfo) {
  flattenObject.push(JSON.flatten(barInfo));
});

// Convert from Object to CSV
var csvObject = Papa.unparse(flattenObject, {
	quotes: true
});

if (csvObject) {
  console.log('Succesfully exported CSV!');
}

// Save CSV
var fs = require('fs');
fs.write('barOutput/barlist.csv', csvObject, 'w');


phantom.exit();