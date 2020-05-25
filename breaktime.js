function Get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

var breakDuration = 10;

function tElapsedToS(tstart) {
    return Math.round((Date.now() - tstart) / 1000);
}

function secondsToString(seconds) {
    var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    return numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

window.onload = function() {
    chrome.storage.local.get('btdur', function(data) {
        if (data.btdur !== undefined) {
            breakDuration = data.btdur;
        }
    });

    var json_obj = JSON.parse(Get("quotes.json"));
    document.getElementById("result").innerHTML =
        json_obj.data[getRandomInt(json_obj.data.length)].inspirational_quote;

    var url = Get("https://inspirobot.me/api?generate=true");
    this.document.getElementById("img").src = url;


    chrome.storage.sync.get('breaktimer', function(data) {
        breakDuration = data.breaktimer.duration;
    });
    chrome.storage.local.set({'btdur': breakDuration}); // cache
    // this.document.getElementById("break").play();

    var tstart = Date.now();
    chrome.storage.local.get('breaktimer', function(data) {
        tstart = data.breaktimer.starttime;
        this.document.getElementById("time").innerHTML = secondsToString(breakDuration - tElapsedToS(tstart));
    });
    this.document.getElementById("time").innerHTML = secondsToString(breakDuration - tElapsedToS(tstart));

    var countdown = window.setInterval(function () {
        if (tElapsedToS(tstart) >= breakDuration) {
            window.clearInterval(countdown);
            this.document.getElementById("time").innerHTML = "Break Done!!!";
            this.document.getElementById("return").play();
            chrome.storage.local.set({'breaktimer': {'status': 'breakdone',
                                                     'starttime': Date.now()}})
        } else {
            this.document.getElementById("time").innerHTML = secondsToString(breakDuration - tElapsedToS(tstart));
        }
    }, 1000)

    // while (Date.now() - tstart < 10000) {
    //     // alert("Hey, you're still on break!");
    //     console.log('hi');
    //     this.document.getElementById("time").innerHTML = Date.now() - this.tstart;
    // }
}

chrome.storage.onChanged.addListener(function (changes, areaname) {
    console.log(areaname, changes);
    if (areaname == "sync") {
      if (changes.breaktimer !== undefined) {
        breakDuration = changes.breaktimer.newValue.duration;
        chrome.storage.local.set({'btdur': breakDuration}); // cache
      }
    }
  });