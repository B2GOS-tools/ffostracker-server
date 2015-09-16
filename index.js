var Firebase = require('firebase');
var owdroot = new Firebase('https://owd.firebaseio.com/');
var updateInterval = 3000;

// List with all the potential searches to be done, it includes all 
// the information related to the query. 
// All the callbacks are calls to parseBugList indicating the version and
// type of bugs (nominations or blockers)
var searches = [];

///// 2.5 //////
searches.push({
  key: "2.5noms",
  type: 'bug',
  options: {
    'bug_status': ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
    'field0-0-0': 'cf_blocking_b2g',
    'type0-0-0': 'contains_any',
    'value0-0-0': '2.5?',
    'include_fields': 'component'
  },
    callback: function(result) {
      parseBugList(result, "2_5", "noms");
  }
})

searches.push({
  key: "2.5blockers",
  type: 'bug',
  options: {
    'bug_status': ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
    'field0-0-0': 'cf_blocking_b2g',
    'type0-0-0': 'contains_any',
    'value0-0-0': '2.5+',
    'include_fields': 'component'
  },
  callback: function(result) {
    parseBugList(result, "2_5", "blockers");
  }
})

////// 2.2 /////////
searches.push({
  key: "2.2noms",
  type: 'bug',
  options: {
    'bug_status': ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
    'field0-0-0': 'cf_blocking_b2g',
    'type0-0-0': 'contains_any',
    'value0-0-0': '2.2?',
    'include_fields': 'component'
  },
    callback: function(result) {
      parseBugList(result, "2_2", "noms");
  }
})

searches.push({
  key: "2.2blockers",
  type: 'bug',
  options: {
    'bug_status': ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
    'field0-0-0': 'cf_blocking_b2g',
    'type0-0-0': 'contains_any',
    'value0-0-0': '2.2+',
    'include_fields': 'component'
  },
  callback: function(result) {
    parseBugList(result, "2_2", "blockers");
  }
})

////// 3.0 /////////
searches.push({
  key: "3.0noms",
  type: 'bug',
  options: {
    'bug_status': ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
    'field0-0-0': 'cf_blocking_b2g',
    'type0-0-0': 'contains_any',
    'value0-0-0': '3.0?',
    'include_fields': 'component'
  },
    callback: function(result) {
      parseBugList(result, "3_0", "noms");
  }
})

searches.push({
  key: "3.0blockers",
  type: 'bug',
  options: {
    'bug_status': ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
    'field0-0-0': 'cf_blocking_b2g',
    'type0-0-0': 'contains_any',
    'value0-0-0': '3.0+',
    'include_fields': 'component'
  },
  callback: function(result) {
    parseBugList(result, "3_0", "blockers");
  }
})

function parseBugList(result, version, type)
{
  var counts = {};
  var platform = 0; 
  var gaia = 0;

  // The structure is the same for noms and blockers but
  // we denote them with "?" and "+" respectively
  var bzversion = version;
  if (type=="noms")
    bzversion += "?";
  else
    bzversion += "+"

  bugs = JSON.parse(result).bugs;

  for(var i = 0; i< bugs.length; i++) { // Categorize all bugs per component
    var component = bugs[i].component;
    counts[component] = counts[component] ? counts[component]+1 : 1;
  }

  // We populate the Firebase Database with a ready to use dashboard diggested 
  // information:
  // ...dashboard/<bzversion>/<Component_Name>/
  // E.g.
  // ...dashboard/2_5+/<Component_Name>/
  // So we go through all the component figures and we also take the 
  // opportunity to aggregate all Gaia Bugs together
  Object.keys(counts).forEach(function(key) {
    var childRef = 
      owdroot.child("dashboard/" + bzversion + '/' + key.replace('/',''));
    childRef.set(counts[key]);

    if (key.lastIndexOf("Gaia", 0) === 0) {
      gaia += counts[key];
    }
    else {
      platform += counts[key];
    }
  });

  // We populate the Firebase Database in two different places for
  // legacy reasons... 
  // ...blockers/2_5/AllBugs
  // ...blockers/2_5/AllGaiaBugs
  // ...blockers/2_5/AllPlatformBugs
  // ...noms/2_5/AllBugs
  // ...noms/2_5/AllGaiaBugs
  // ...noms/2_5/AllPlatformBugs
  // A ready to use dashboard diggested information
  // ...dashboard/summary-2_5+/AllBugsBugs/
  // ...dashboard/summary-2_5+/AllGaiaBugs/
  // ...dashboard/summary-2_5+/AllPlatformBugs/
  var childRef = owdroot.child(type + '/' + version + '/AllBugs');
  childRef.set(gaia+platform);
  childRef = owdroot.child("dashboard/summary-" + bzversion + '/AllBugsBugs');
  childRef.set(gaia+platform);
  childRef = owdroot.child(type + '/' + version + '/AllPlatformBugs');
  childRef.set(platform);
  childRef = owdroot.child("dashboard/summary-" + bzversion + '/AllPlatformBugs');
  childRef.set(platform);
  childRef = owdroot.child(type + '/' + version + '/AllGaiaBugs');
  childRef.set(gaia);
  childRef = owdroot.child("dashboard/summary-" + bzversion + '/AllGaiaBugs');
  childRef.set(gaia);
}

function searchBugzilla() {
  console.log("Searching Data in Bugzilla");
  //date = new Date();
  searches.forEach(function(search) {
      Bugzilla.ajax({
        url: '/' + search.type,
        data: search.options,
        success: function(data) {
        search.callback(data);
      },
      error: function(err) { console.log('err', err)}
    })
  })
}

// Log me into Firebase
// TODO - Not publish this
var AUTH_TOKEN = "2aHXWBO3CVDorZarFvQ4xTSJ0BYiTQlmEx6bIS32";
owdroot.auth(AUTH_TOKEN, function(error) {
  if(error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Login Succeeded!");
  }
});

// Main Logic, we execute this every interval
setInterval((function() {
  searchBugzilla();
}), updateInterval);

// Convenience library to perform Mozilla queries
var Bugzilla = {
  BASE_URL: "https://api-dev.bugzilla.mozilla.org/latest",
  BASE_UI_URL: "https://bugzilla.mozilla.org",
  DEFAULT_OPTIONS: {
    method: "GET"
  },
  queryString: function Bugzilla_queryString(data) {
    var parts = [];
    for (name in data) {
      var values = data[name];
      if (!values.forEach)
        values = [values];
      values.forEach(
        function(value) {
          parts.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
        });
    }
    return parts.join("&");
  },
  ajax: function Bugzilla_ajax(options) {
    var newOptions = {__proto__: this.DEFAULT_OPTIONS};
    for (name in options)
      newOptions[name] = options[name];
    options = newOptions;

    function onLoad() {
      var response = JSON.parse(xhr.responseText);
      if (!response.error)
        //options.success(response);
        options.success(xhr.responseText);
      else if (options.error)
        options.error(response.error);
    }

    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var xhr = new XMLHttpRequest();
    //var xhr = options.xhr ? options.xhr : new XMLHttpRequest();
    var url = this.BASE_URL + options.url;

    var data = null;
    if (options.data) {
      if (options.method == "GET")
        url = url + "?" + this.queryString(options.data);
      else {
        if (options.data.username && options.data.password)
          url = url + "?" + this.queryString({ username: options.data.username, password: options.data.password});
        data = JSON.stringify(options.data);
      }
    }
    xhr.open(options.method, url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.addEventListener("load", onLoad, false);
    xhr.send(data);
    return xhr;
  }
};
