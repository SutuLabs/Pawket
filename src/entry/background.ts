console.log('background initialized')

export interface RequestType {
  command: "store" | "retrieve" | "remove";
  key?: string;
  value?: string;
}

export interface ResponseType {
  ok: boolean;
  error?: string;
  value?: string;
}

chrome.runtime.onMessage.addListener(
  function (request: RequestType, sender, sendResponse: (response?: ResponseType) => void) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");

    if (request.command === "store" && request.key && request.value) {
      console.log("background: store")
      chrome.storage.local.set({ [request.key]: request.value }, () => {
        sendResponse({ ok: true });
      });
    }
    else if (request.command === "retrieve" && request.key) {
      console.log("background: retrieve", request)
      chrome.storage.local.get(request.key, (valueObj) => {
        sendResponse({ ok: true, value: valueObj[request.key ?? ""] });
      });
    }
    else if (request.command === "remove" && request.key) {
      console.log("background: remove", request)
      chrome.storage.local.remove(request.key, () => {
        sendResponse({ ok: true });
      });
    }
    else {
      sendResponse({ ok: false, error: "unknown command: " + request.command });
    }
  }
);