'use strict';

var popupWindow;
var tstart;
var interval = 30;
var duration = 10 * 60;
// var myAudio = new Audio(chrome.runtime.getURL("assets/startwork.mp3"));
// var myAudio2 = new Audio(chrome.runtime.getURL("assets/breakalert.mp3"));
// var myAudioAutowork = new Audio(chrome.runtime.getURL("assets/autowork.mp3"));

let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one 
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK', 'LOCAL_STORAGE'],
      justification: 'Playback audio & alerts',
    });
    await creating;
    creating = null;
  }
}
async function send_to_offscreen(obj) {
  await setupOffscreenDocument('offscreen.html');
  return await chrome.runtime.sendMessage(obj);
}

async function play_audio(name) {
  await send_to_offscreen({action: "sound", file: `assets/${name}.mp3`});
}

async function do_alert(msg) {
  await send_to_offscreen({action: "alert", message: msg});
}

async function do_confirm(msg) {
  return await send_to_offscreen({action: "confirm", message: msg});
}

function openPopup() {
    // popupWindow = openWindow('breaktime.html');
    // popupWindow = window.open('breaktime.html');
    // play_audio('breakalert');
    // do_alert("Time to take a break!!! Click 'ok' to start the break.");
    // alert("Time to take a break!!! Click 'ok' to start the break.");
    // We want to play the sound then display the alert, but offscreen makes this annoying
    (async () => {
      await play_audio('breakalert');
      // await do_alert("Time to take a break!!! Click 'ok' to start the break.");
      const resp = await do_confirm("Time to take a break!!! Click 'ok' to start the break or 'cancel' to delay the break (popup in background).");
      await chrome.tabs.create({url: "breaktime.html", active: resp});
      if (resp) {
        chrome.storage.local.set({
          breaktimer: { status: "Relaxing", starttime: Date.now() },
        });
      }
    })();
}

var onbreak = false;

async function closePopup() {
  const breaktime_tab = await chrome.tabs.query({url: "chrome-extension://*/breaktime.html"});
  for (const tab of breaktime_tab) {
    chrome.tabs.remove(tab.id);
  }
}

function startWork(with_audio=true) {
  if (with_audio) {
    play_audio("startwork");
  }

  closePopup();

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
        (async () => {
          await do_alert("Ready to return to work? ");
          // window.close(popupWindow);
          startWork();
        })();
        onbreak = false;
      }
    }
  }
});