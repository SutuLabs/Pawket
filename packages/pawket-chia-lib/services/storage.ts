import Vue from "vue";

export type StorageType = "chrome.sync" | "chrome.local" | "localStorage" | "background";

interface TypedVue extends Vue {
  readonly $storeType: StorageType;
}

export default class UniStorage {
  public type: StorageType = "localStorage";

  constructor(type: StorageType) {
    this.type = type;
    // console.log("initialize storage with type: ", this.type);
  }

  public static create(): UniStorage {
    const dt = (Vue as unknown as TypedVue)?.$storeType;
    // if (!dt) throw new Error("should initialize through `Vue.prototype.$storeType = 'localStorage';` first.");
    if (!dt) return new UniStorage("localStorage");
    return new UniStorage(dt);
  }

  public async setItem(key: string, value: string): Promise<void> {
    if (this.type == "localStorage")
      return localStorage.setItem(key, value);
    else if (this.type == "chrome.sync")
      return await chrome.storage.sync.set({ [key]: value });
    else if (this.type == "chrome.local")
      return await chrome.storage.local.set({ [key]: value });
    else if (this.type == "background")
      return await this.storeToBackground(key, value);
    else
      throw new Error("unexpected type: " + this.type)
  }

  public async getItem(key: string): Promise<string | null> {
    if (this.type == "localStorage")
      return localStorage.getItem(key);
    else if (this.type == "chrome.sync")
      return (await chrome.storage.sync.get(key))[key];
    else if (this.type == "chrome.local")
      return (await chrome.storage.local.get(key))[key];
    else if (this.type == "background")
      return await this.retrieveFromBackground(key);
    else
      throw new Error("unexpected type: " + this.type)
  }

  public async removeItem(key: string): Promise<void> {
    if (this.type == "localStorage")
      return localStorage.removeItem(key);
    else if (this.type == "chrome.sync")
      return await chrome.storage.sync.remove(key);
    else if (this.type == "chrome.local")
      return await chrome.storage.local.remove(key);
    else if (this.type == "background")
      return await this.removeFromBackground(key);
    else
      throw new Error("unexpected type: " + this.type)
  }

  private storeToBackground(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: "store", key, value }, function (response) {
        if (response.ok) return resolve();

        console.warn("failed to store to background", response.error);
        return reject(new Error("failed to store to background:" + response.error));
      });
    });
  }

  private retrieveFromBackground(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: "retrieve", key }, function (response) {
        if (response.ok && response.value !== undefined) return resolve(response.value);

        console.warn("failed to retrieve from background", response.error);
        return reject(new Error("failed to retrieve from background:" + response.error));
      });
    });
  }

  private removeFromBackground(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: "remove", key }, function (response) {
        if (response.ok) return resolve();

        console.warn("failed to retrieve from background", response.error);
        return reject(new Error("failed to retrieve from background:" + response.error));
      });
    });
  }
}
