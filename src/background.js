chrome.runtime.onConnect.addListener(function bsListener(cPort) {
  // registerCors();
  console.assert(cPort.name == "cresta-voiceflow-background");
  cPort.onMessage.addListener(function (msg) {
    console.log(
      `%cresta-voiceflow-background msg received`,
      "color:darkviolet"
    );
    if (msg.type === "pageload") {
      console.log(" => ", msg.path);
      registerCors(msg.path);
    }
  });
});

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

function registerCors(path) {
  try {
    const extra = ["blocking"];
    if (/Firefox/.test(navigator.userAgent) === false) {
      extra.push("extraHeaders");
    }
    const urls = [`${path}`];
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
            if (hasCookie) {
              tabHeaders[details.tabId] = requestHeaders;
            }
          }
          return { requestHeaders };
        },
        { urls },
        ["requestHeaders", ...extra]
      );
    } else {
      console.log("URL no correct");
    }
  } catch (error) {
    console.log("invalid JSON in option!");
  }
}
