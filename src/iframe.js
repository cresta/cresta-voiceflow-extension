// inside the iframe
function saveStorageToParentStorage(key) {
  const val = localStorage.getItem(key);
  const domain = `eexReadOnly:${location.host}:${key}`;
  window.parent.postMessage({ type: 'saveToParentStorage', key: domain, val }, "*");
}

if (window.self !== window.top) {
  // insert eex helpers for iframe 
  const element = document.createElement('script');
  const text = `window.eex={}; window.eex.saveStorageToParentStorage=${saveStorageToParentStorage};`;
  element.appendChild(document.createTextNode(text));
  element.id = 'eexIFrameMessenger';
  document.querySelector('html').appendChild(element);


  window.addEventListener("message", (event) => {
    if (event.data.type === 'eexAppendScript' && event.data.script.length) {
      const element = document.createElement('script');
      element.appendChild(document.createTextNode(event.data.script));
      document.querySelector('html').appendChild(element);
    }
  });
}
