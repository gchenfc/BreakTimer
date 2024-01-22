'use strict';

var popupWindow;
var tstart;
var interval = 30;
var duration = 10 * 60;
var myAudio = new Audio(chrome.runtime.getURL("assets/startwork.mp3"));
var myAudio2 = new Audio(chrome.runtime.getURL("assets/breakalert.mp3"));
var myAudioAutowork = new Audio(chrome.runtime.getURL("assets/autowork.mp3"));

function openPopup() {
    popupWindow = window.open('breaktime.html');
    myAudio2.play();
    alert("Time to take a break!!! Click 'ok' to start the break.");
    chrome.storage.local.set({breaktimer: {status: "Relaxing",
                                           starttime: Date.now()}});

    window.setTimeout(function () {
      chrome.storage.local.get('breaktimer', function(data) {
        if (data.breaktimer.status == "Relaxing") {
          myAudioAutowork.play();
          startWork();
          onbreak = false;
        };
      });
    }, (duration+3) * 1000);
}

var onbreak = false;

function startWork() {
  myAudio.play();
  chrome.storage.local.set({breaktimer: {status: "Working",
                                         starttime: Date.now()}});
  chrome.alarms.create("alarm",
  {
    delayInMinutes: interval
  });
  onbreak = false;
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({breaktimer: {interval: interval, duration: duration}}, function() {
    console.log("break timer set to defaults");
  });
  chrome.storage.local.set({breaktimer: {status: "idle",
                                         starttime: Date.now()} });
  chrome.storage.local.set({'btcache': {interval: interval,
                                        duration: duration}});
  chrome.storage.local.set({'btdur': duration}); // cache
  startWork();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (onbreak) {
    return;
  } else if (alarm.name == "alarm") {
    onbreak = true;
    openPopup();
  }
});

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
      if (changes.breaktimer.newValue.status == "breakdone") {
        alert("Ready to return to work? ");
        // window.close(popupWindow);
        startWork();
        onbreak = false;
      }
    }
  }
});