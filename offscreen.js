
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "sound") {
    console.log(`playing ${request.file}`);
    var audio = new Audio(chrome.runtime.getURL(request.file));
    audio.play();
  }
  if (request.action === "alert") {
    console.log(`alerting ${request.message}`);
    alert(request.message);
  }
});
