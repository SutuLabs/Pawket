console.log('background initialized')

export interface RequestType {
  command: "store" | "retrieve" | "remove"
  | "getAddress";
  key?: string;
  value?: string;
}

export interface ResponseType {
  ok: boolean;
  error?: string;
  key?: string;
  value?: string;
  result?: string;
}

const memoryState: { [key: string]: string } = {};

chrome.runtime.onMessage.addListener(
  function (request: RequestType, sender, sendResponse: (response?: ResponseType) => void) {
    if (sender.tab) {
      // console.log("from a content script:" + sender.tab.url);

      if (request.command === "getAddress") {
        // console.log("getAddress requested, but not implement yet.")
        // sendResponse({ ok: true, result: "heelo" });
        sendResponse({ ok: false, error: "getAddress requested, but not implement yet." });
      }
    }
    else {
      // console.log("from the extension");

      if (request.command === "store" && request.key && request.value) {
        // console.log("background: store")
        if (request.key.startsWith("MEMORY_")) {
          memoryState[request.key] = request.value;
          sendResponse({ ok: true, key: request.key });
        }
        else {
          chrome.storage.local.set({ [request.key]: request.value }, () => {
            sendResponse({ ok: true, key: request.key });
          });
        }
      }
      else if (request.command === "retrieve" && request.key) {
        // console.log("background: retrieve", request)
        if (request.key.startsWith("MEMORY_")) {
          sendResponse({ ok: true, key: request.key, value: memoryState[request.key] ?? null });
        }
        else {
          chrome.storage.local.get(request.key, (valueObj) => {
            sendResponse({ ok: true, key: request.key, value: valueObj[request.key ?? ""] ?? null });
          });
        }
      }
      else if (request.command === "remove" && request.key) {
        // console.log("background: remove", request)
        if (request.key.startsWith("MEMORY_")) {
          delete memoryState[request.key];
          sendResponse({ ok: true, key: request.key });
        }
        else {
          chrome.storage.local.remove(request.key, () => {
            sendResponse({ ok: true, key: request.key });
          });
        }
      }
      else {
        sendResponse({ ok: false, error: "unknown command: " + request.command });
      }
    }

    return true;
  }
);