const bPort = chrome.runtime.connect({ name: "cresta-voiceflow-background" }); // background port

// core function for content script load, example.: /src/scripts/inject.js
const appendContentJs = function (path, uniqueId) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      const element = document.createElement("script");
      element.id = uniqueId;
      element.appendChild(document.createTextNode(`${xmlHttp.responseText}`));
      document.querySelector("html").appendChild(element);
    }
  };
  xmlHttp.open("GET", path, true);
  xmlHttp.send(null);
};

// register for document ready event
function onDocumentReady(fn = () => {}) {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

var basePath =
  "https://raw.githubusercontent.com/cresta/cresta-voiceflow-extension/main/pages";
function getScriptUrlToLoad() {
  const path = window.location.pathname;
  return `${basePath}/${path.split("/")[1]}.js`;
}

// load
chrome.storage.sync.get({ urllink: "[]" }, function () {
  console.log("calling page load");
  const text = `window.crestaVF={};
          window.crestaVF.onDocumentReady=${onDocumentReady}`;
  const element = document.createElement("script");
  element.id = "cresta-voiceflow-extension";
  element.appendChild(document.createTextNode(text));
  document.querySelector("html").appendChild(element);
  const scriptUrl = getScriptUrlToLoad();
  console.log(scriptUrl, window.location.pathname);
  bPort.postMessage({ type: "pageload", path: scriptUrl });
  appendContentJs(scriptUrl, "boot");
});
