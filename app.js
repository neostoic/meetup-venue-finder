var page = require('webpage').create();
var screenshotNum = 1;
var screenshotPath = 'screenshots/foursquare';
var userInformation = {};
var searchForUserInformation = false;
var Papa = require('./babyparse.js');
var numMaxBars = 50;
var isReviewOn = false;
var searchTerm = 'Pubs';
var searchLocation = 'Rio de Janeiro, RJ, Brazil';
var loginEmail = 'YOUR_EMAIL_ADDRESS';
var loginPassword = 'YOUR_PASSWORD';

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

// Fill out login fields and submit it
page.evaluate(function(loginEmail, loginPassword) { 
  document.getElementById('username').value = loginEmail;
  document.getElementById('password').value = loginPassword;
  document.getElementById('loginFormButton').click();
}, loginEmail, loginPassword);
do { phantom.page.sendEvent('mousemove'); } while (page.loading);
console.log('Logged in!');
page.render(screenshotPath + screenshotNum++ + '.png');

if(searchForUserInformation) {
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
page.evaluate(function(searchTerm, searchLocation) {
  console.log('Search Term: ' + searchTerm);
  console.log('Location: ' + searchLocation);
  document.getElementById('headerBarSearch').value = searchTerm;
  document.getElementById('headerLocationInput').value = searchLocation;
  document.querySelector('.submitButton').click();
}, searchTerm, searchLocation);
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
      console.log('clicking on element: ' + element.innerText);
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
//for (var i = 0; i < barList.length; i++) {
if(numMaxBars > barList.length) numMaxBars = barList.length;
for (var i = 0; i < numMaxBars; i++) {
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
  var barInformation = page.evaluate(function(isReviewOn) {
    function getPropertyInformation(obj, propName, propSelector, propProperty) {
      if (document.querySelector(propSelector)) {
        obj[propName] = document.querySelector(propSelector)[propProperty];
      }
      return obj;
    }
    
    var barInformation = {};
    barInformation = getPropertyInformation(barInformation, 'name', '.venueName', 'innerText');
    barInformation = getPropertyInformation(barInformation, 'neighborhood', '.neighborhood', 'innerText');
    barInformation = getPropertyInformation(barInformation, 'address', '.adr', 'innerText');
    barInformation = getPropertyInformation(barInformation, 'telephone', '.tel', 'innerText');
    barInformation = getPropertyInformation(barInformation, 'website', '.url', 'href');
    barInformation = getPropertyInformation(barInformation, 'twitter', '.twitterPageLink', 'href');
    barInformation = getPropertyInformation(barInformation, 'facebook', '.facebookPageLink', 'href');
    barInformation = getPropertyInformation(barInformation, 'rating', '[itemprop=ratingValue]', 'innerText');
    if (document.querySelector('[itemprop=priceRange]')) {
      barInformation.price = document.querySelector('[itemprop=priceRange]').innerText.replace(/\s+/g, '');
    }
    
    // // Outdoor seating has no ID's or specific classes
    // var venueSecondaryAttr = document.querySelectorAll('.venueAttr, .secondaryAttr');
    // for (i = 0; i < venueSecondaryAttr.length; ++i) {
    //   var attrKey = venueSecondaryAttr[i].firstElementChild.innerText;
    //   if(attrKey.match('Outdoor Seating')) {
    //     barInformation.outdoorSeating = venueSecondaryAttr[i].lastElementChild.innerText;
    //   }
    // }
    
    // TODO: Figure out a better way to save reviews to CSV
    // Get list of reviews
    if(isReviewOn) {
      var reviewsList = document.getElementById('tipsList').children;
      barInformation.reviews = {};
      for (var j = 0; j < reviewsList.length; ++j) {
        var tipContents = reviewsList[j].lastElementChild.children;
        var barReview = {};
        barReview.text = tipContents[0].innerText.toString();
        barReview.date = tipContents[1].children[1].innerText.toString();
        barInformation.reviews['review' + j] = barReview;
      }
    }
    return barInformation;
  }, isReviewOn);
  barInformation.foursquare = barUrl;
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