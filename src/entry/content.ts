const url = chrome.runtime.getURL("/js/inpage.js")
injectScript(url);

function injectScript(url: string) {
  try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('async', 'false');
    scriptTag.setAttribute("src", url);
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);
  } catch (error) {
    console.error('Provider injection failed.', error);
  }
}

document.addEventListener("chia.getAddress.request", function () {
  chrome.runtime.sendMessage({ command: "getAddress" }, function (response) {
    const event = new CustomEvent("chia.getAddress.response", {
      detail: {
        ok: response.ok,
        address: response.result,
        error: response.error,
      }
    });
    document.dispatchEvent(event);
  });
});