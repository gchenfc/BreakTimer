'use strict';

var interval = 0;
var duration = 0;
var inputinterval = document.getElementById("interval");
var inputduration = document.getElementById("duration");

function setStatus(status) {
  var elem = document.getElementById("status");
  elem.innerHTML = status;
  switch (status) {
    case "Working":
      elem.style.color = "red";
      break;
    case "Relaxing":
      elem.style.color = "blue";
      break;
    case "breakdone":
      elem.style.color = "magenta";
      break;
    case "Idle":
      elem.style.color = "black";
      break;
  }
}

async function play_start_sound() {
  const to_play = await chrome.storage.sync.get("play_sound");
  if (to_play.play_sound) {
    document.getElementById("start").play();
  }
}

function click(e) {
  if (e.target.id == "on") {
    chrome.alarms.get("alarm", function (alarm) {
      if (alarm !== undefined) {
        alert("alarm already set");
        return;
      } else {
        chrome.storage.local.set({breaktimer: {status: "Working",
                                               starttime: Date.now()}});
        chrome.alarms.create("alarm",
        {
          delayInMinutes: interval
        });
        setStatus("Working");
        play_start_sound();
      }
    });
  } else if (e.target.id == "off") {
    chrome.alarms.clear("alarm", function (wasCleared) {
      console.log("Alarms " + (wasCleared?"":"Not ") + "Cleared");
    });
    chrome.storage.local.set({breaktimer: {status: "Idle",
                                           starttime: Date.now()}});
  }
  // window.close();
}

function updatelabels() {
  chrome.storage.local.get('breaktimer', function(data) {
    setStatus(data.breaktimer.status);
    var tot = Infinity;
    switch (data.breaktimer.status) {
      case "Working":
        tot = interval;
        break;
      case "Relaxing":
        tot = duration / 60;
        break;
    }
    this.document.getElementById("remaining").innerHTML = Math.round((tot - (Date.now() - data.breaktimer.starttime) / 1000 / 60) * 10) / 10.0;
  })
}

document.addEventListener('DOMContentLoaded', function () {

  chrome.storage.sync.get('breaktimer', function(data) {
    if (data.breaktimer !== undefined) {
      interval = data.breaktimer.interval;
      duration = data.breaktimer.duration;
    }
    updatelabels();
    inputinterval = document.getElementById("interval");
    inputduration = document.getElementById("duration");
    inputinterval.value = interval;
    inputduration.value = duration / 60;
    // Interval and Duration inputs
    function updatesync() {
      chrome.storage.sync.set({breaktimer: {interval: interval,
                                            duration: duration}});
    }
    inputinterval.addEventListener("keyup", function(event) {
      console.log(event.keyCode, event.key);
      // Number 13 is the "Enter" key on the keyboard
      if ((event.keyCode === 13) || (event.key === 'Tab')) {  // TODO: tab doesn't work
        event.preventDefault();
        interval = parseFloat(inputinterval.value);
        updatesync();

        // correct alarm timer
        chrome.storage.local.get("breaktimer", function (data) {
          chrome.alarms.clear("alarm");
          chrome.alarms.create("alarm", {
            when: interval * 60 * 1000 + data.breaktimer.starttime,
          });
        });
      }
    });
    inputduration.addEventListener("keyup", function(event) {
      // Number 13 is the "Enter" key on the keyboard
      if ((event.keyCode === 13) || event.key == 'Tab') {
        event.preventDefault();
        duration = parseFloat(inputduration.value) * 60;
        updatesync();
      }
    });
  })

  var countdown = window.setInterval(function () {
    updatelabels();
  }, 1000)

  var divs = document.querySelectorAll('div');
  for (var i = 0; i < divs.length; i++) {
    divs[i].addEventListener('click', click);
  }
});

// chrome.alarms.onAlarm.addListener(function (alarm) {
//   if (alarm.name == "alarm") {
//     setStatus("Breaking)"
//   }
// });

chrome.storage.onChanged.addListener(function (changes, areaname) {
  console.log(areaname, changes);
  if (areaname == "sync") {
    if (changes.breaktimer !== undefined) {
      interval = changes.breaktimer.newValue.interval;
      duration = changes.breaktimer.newValue.duration;
    }
  }
  if (areaname == "local") {
    if (changes.breaktimer !== undefined) {
      setStatus(changes.breaktimer.newValue.status);
    }
  }
  updatelabels();
});