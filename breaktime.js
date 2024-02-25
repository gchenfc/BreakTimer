function Get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function tElapsedToS(tstart) {
    return Math.round((Date.now() - tstart) / 1000);
}

function secondsToString(seconds) {
    var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    return numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

function populate_ai_img(display) {
    if (display) {
        var url = Get("https://inspirobot.me/api?generate=true");
        this.document.getElementById("AI_img").src = url;
    } else {
        this.document.getElementById("AI_img_div").style.display = 'none';
    }
}

function populate_quotes(display) {
    if (display) {
        var json_obj = JSON.parse(Get("assets/quotes.json"));
        document.getElementById("quote").innerHTML =
            json_obj.data[getRandomInt(json_obj.data.length)].inspirational_quote;
    } else {
        this.document.getElementById("quote").style.display = 'none';
    }
}

function populate_yoga(display) {
    if (display) {
        var json_obj = JSON.parse(Get("assets/yoga_poses.json"));

        // Concatenate the "poses" field for each object in the array
        const all_poses = json_obj.reduce((acc, cur) => acc.concat(cur.poses), []);

        var pose = all_poses[getRandomInt(all_poses.length)];
        this.document.getElementById("yoga_pose_name").innerHTML = `${pose.english_name} (${pose.sanskrit_name})`;
        this.document.getElementById("yoga_pose_etymology").innerHTML = `${pose.translation_name}`;
        this.document.getElementById("yoga_pose_img").src = pose.url_svg;
        this.document.getElementById("yoga_pose_desc").innerHTML = `${pose.pose_benefits}<br /><br />${pose.pose_description}`;
    } else {
        this.document.getElementById("yoga").style.display = 'none';
    }
}

function populate_french(display) {
    if (display) {
        var json_obj = JSON.parse(Get("assets/french_words_by_freq.json"));
        // var word = json_obj[getRandomInt(json_obj.length)];
        chrome.storage.sync.get('zipf_parameter', function(data) {
            var wordIndex = getRandomZipfIndex(json_obj.length, data.zipf_parameter);
            var word = json_obj[wordIndex];
            this.document.getElementById("word").innerHTML = word.French + " = " + word.English;
            this.document.getElementById("example").innerHTML = "Par exemple: " + word.SampleSentence;
        });
    } else {
        this.document.getElementById("french").style.display = 'none';
    }
}

var breakDuration = 10;
var status = "Working";
var tstart = Date.now();

async function setup() {
    ({ breaktimer: {duration: breakDuration} } = await chrome.storage.sync.get("breaktimer"));
    ({ breaktimer: {status, starttime: tstart} } = await chrome.storage.local.get("breaktimer"));
    if (status == "Relaxing") {
        this.document.getElementById("time").innerHTML = secondsToString(breakDuration - tElapsedToS(tstart));
    } else {
        this.document.getElementById("time").innerHTML = "Still Working...";
        this.document.getElementById("start_break").onclick = startBreak;
        this.document.getElementById("start_break").style.display = 'block';
    }
    console.log(`status: ${status}, tstart: ${tstart}, breakDuration: ${breakDuration}`);
    console.log(await chrome.storage.local.get("breaktimer"));
}

// only called when the user clicks the "Start Break" button
function startBreak() {
    status = "Relaxing";
    tstart = Date.now();
    chrome.storage.local.set({ breaktimer: { status: status, starttime: tstart } });
    document.getElementById("start_break").style.display = 'none';
    document.getElementById("time").innerHTML = secondsToString(breakDuration - tElapsedToS(tstart));
}

async function play_sound(name) {
  const to_play = await chrome.storage.sync.get("play_sound");
  if (to_play.play_sound) {
    document.getElementById(name).play();
  }
}

window.onload = function() {
    const func_opts = {
      AI_img: populate_ai_img,
      quote: populate_quotes,
      yoga_pose: populate_yoga,
      french_word: populate_french,
    };
    for (const [opt, func] of Object.entries(func_opts)) {
        chrome.storage.sync.get({ [opt]: false }, function(data) {
            func(data[opt]);
        });
    }

    setup();

    var countdown = window.setInterval(function () {
        if (status == "Working") {
            this.document.getElementById("time").innerHTML = "Still Working...";
            this.document.getElementById("start_break").onclick = startBreak;
            this.document.getElementById("start_break").style.display = 'block';
            return;
        }
        if (tElapsedToS(tstart) >= breakDuration) {
            window.clearInterval(countdown);
            this.document.getElementById("time").innerHTML = "Break Done!!!";
            play_sound("return");
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