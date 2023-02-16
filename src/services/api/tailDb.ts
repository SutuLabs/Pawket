import { chainId, mainnetChainId, rpcUrl } from "@/store/modules/network";
import UniStorage from "../storage";

interface Tail {
  name: string;
  code: string;
  description: string;
  category: string;
  id: string;
  uri: string;
}

export interface TailInfo {
  hash: string;
  code: string;
  logo_url: string;
}

class TailDb {
  private storageKey = "TAILDB_CAT_LIST";
  private lastUpdateKey = "TAILDB_LAST_UPDATE";
  private ustore = UniStorage.create();
  private validityPeriod: number = 24 * 60 * 60; // unit: second

  private async getCatFromTailDb(): Promise<void> {
    const resp = await fetch(rpcUrl() + 'misc/taildb', {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-version": "2",
      },
    });
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    const p = (await resp.json()) as Tail[];
    const tails: TailInfo[] = p
      .filter((t) => t.id && t.code && t.uri)
      .map((tail) => ({
        hash: tail.id,
        code: tail.code,
        logo_url: tail.uri,
      }));
    tails.sort((a, b) => a.code.localeCompare(b.code));
    this.ustore.setItem(this.storageKey, JSON.stringify(tails));
    this.ustore.setItem(this.lastUpdateKey, Date.now().toString());
  }

  private async checkAndUpdate(): Promise<void> {
    const lastUpdate = await this.ustore.getItem(this.lastUpdateKey);
    const t = await this.ustore.getItem(this.storageKey);
    if (!lastUpdate || !t) {
      await this.getCatFromTailDb();
      return;
    }
    const elapsed = Date.now() - Number(lastUpdate);
    if (elapsed / 1000 > this.validityPeriod) {
      await this.getCatFromTailDb();
      return;
    }
  }

  public async getTails(): Promise<TailInfo[]> {
    if (chainId() != mainnetChainId()) return [];
    let tails: TailInfo[] = [];
    await this.checkAndUpdate();
    const t = await this.ustore.getItem(this.storageKey);
    if (t == null || t.length === 0) return tails;
    tails = JSON.parse(t) as TailInfo[];
    return tails;
  }
}

export default new TailDb();
