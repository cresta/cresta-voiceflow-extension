chrome.runtime.onConnect.addListener(function bsListener(cPort) {
  registerCors();
  console.assert(cPort.name == "eex-background");
  cPort.onMessage.addListener(function (msg) {
    console.log(`%ceex-background msg received`, "color:darkviolet");
    if (msg.type === "iframe") {
      const iframe = document.querySelector(`#${msg.data.id}`);
      if (iframe) {
        iframe.parentNode.removeChild(iframe);
      }
      console.assert(msg.data.id);
      console.assert(msg.data.src);
      // create iframe
      const element = document.createElement("iframe");
      element.src = msg.data.src;
      element.id = msg.data.id;
      document.querySelector("html").appendChild(element);
    }
    if (msg.type === "localStorageSync") {
      console.assert(msg.data);
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(`eexReadOnly:${msg.data}:`)
      );
      const values = [];
      keys.forEach((key) => {
        values.push({ key, val: localStorage.getItem(key) });
        // remove transferred item
        localStorage.removeItem(key);
      });
      cPort.postMessage({ type: "localStorageSync", data: values });
    }
  });
});

window.addEventListener("message", (event) => {
  if (event.data.type === "saveToParentStorage") {
    console.log("saveToParentStorage");
    console.assert(event.data.key);
    console.assert(event.data.val);
    localStorage.setItem(event.data.key, event.data.val);
  }
});

var urlLinks = [];
const tabHeaders = {};
chrome.tabs.onRemoved.addListener((tabId) => delete tabHeaders[tabId]);

function addOrReplaceHeader(responseHeaders, newHeaders) {
  newHeaders.forEach(function (header) {
    let headerPosition = responseHeaders.findIndex(
      (x) => x.name.toLowerCase() === header.name.toLowerCase()
    );
    if (headerPosition > -1) {
      responseHeaders[headerPosition] = header;
    } else {
      responseHeaders.push(header);
    }
  }, this);
}

function onHeadersReceived(e) {
  let url = e.url;
  console.log(`Add CORS: ${url}`);
  let crossDomainHeaders = [
    // test here https://webbrowsertools.com/test-cors/
    // for fetch with credentials
    //{ name: "access-control-allow-origin", value: e.initiator },
    // for fetch with redirect
    { name: "access-control-allow-origin", value: "*" },
    { name: "access-control-allow-methods", value: "*" },
    { name: "access-control-allow-headers", value: "*" },
    { name: "access-control-expose-headers", value: "*" },
    { name: "access-control-allow-credentials", value: "true" },
  ];
  addOrReplaceHeader(e.responseHeaders, crossDomainHeaders);
  return { responseHeaders: e.responseHeaders };
}

function registerCors() {
  try {
    const extra = ["blocking"];
    if (/Firefox/.test(navigator.userAgent) === false) {
      extra.push("extraHeaders");
    }
    const urls = [];
    const items = [{ link: "http://localhost:8080/extension.js" }];
    if (items instanceof Array) {
      items.forEach((i) => {
        if (i.link) {
          urls.push(i.link);
        }
      });
      if (urls.length) {
        urlLinks = items;
        chrome.webRequest.onHeadersReceived.addListener(
          onHeadersReceived,
          { urls },
          ["responseHeaders", ...extra]
        );
        chrome.webRequest.onBeforeSendHeaders.addListener(
          function (details) {
            let requestHeaders = details.requestHeaders;
            if (requestHeaders.length) {
              const hasCookie = requestHeaders.some(
                (header) => header.name.toLowerCase() === "Cookie".toLowerCase()
              );
              const hasInclude = urlLinks.some(
                (u) =>
                  details.url.includes(u.pathinclude) ||
                  details.url.includes(u.linkinclude)
              );
              if (hasCookie) {
                tabHeaders[details.tabId] = requestHeaders;
              } else if (hasInclude) {
                requestHeaders = tabHeaders[details.tabId];
              }
            }
            return { requestHeaders };
          },
          { urls },
          ["requestHeaders", ...extra]
        );
      }
    } else {
      console.log("JSON is does not have well format!");
    }
  } catch (error) {
    console.log("invalid JSON in option!");
  }
}

// read settings
// chrome.storage.sync.get({ urllink: "" }, (item) => {
// });

// chrome.storage.sync.onChanged.addListener((item) => {
//   chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
//   registerCors({ urllink: item.urllink.newValue });
// }
// );
