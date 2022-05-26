import store from '@/store'
import account, { AccountKey } from "@/services/crypto/account";
import { CoinRecord } from "@/models/wallet";
import Vue from 'vue';
import receive, { NftDetail } from '@/services/crypto/receive';

type AccountType = "Serial" | "Password" | "Legacy";

export interface AccountTokenAddress {
  address: string;
  coins: CoinRecord[];
}

export interface AccountToken {
  amount: bigint;
  addresses: AccountTokenAddress[];
}
export interface AccountTokens {
  [symbol: string]: AccountToken;
}

export interface AccountEntity {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
  firstAddress?: string;
  activities?: CoinRecord[];
  tokens: AccountTokens;
  addressRetrievalCount: number;
  cats: CustomCat[];
  nfts: NftDetail[];
}

export interface CustomCat {
  name: string;
  id: string;
  network: string;
}

const DEFAULT_ADDRESS_RETRIEVAL_COUNT = 4;

export interface TokenInfo {
  [symbol: string]: OneTokenInfo
}

export interface OneTokenInfo {
  id?: string;
  symbol: string;
  decimal: number;
  unit: string;
}

export interface PersistentAccount {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
  addressRetrievalCount: number;
  cats: CustomCat[];
}

export interface IAccountState {
  selectedAccount: number;
  accounts: AccountEntity[];
  tokenInfo: TokenInfo;
  refreshing: boolean;
}

store.registerModule<IAccountState>('account', {
  state() {
    return {
      tokenInfo: {},
      accounts: [],
      selectedAccount: 0,
      refreshing: false,
    }
  },
  actions: {

    async createAccountByPassword(
      { state, dispatch, rootState },
      { password, name }: { password: string; name: string }
    ) {
      const acc = await account.getAccount(rootState.vault.seedMnemonic, password)
      if (state.accounts.find(a => a.key.fingerprint === acc.fingerprint)) {
        throw new Error("account with same fingerprint already exists");
      }
      state.accounts.push({
        key: acc,
        name: name,
        type: "Password",
        tokens: {},
        addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
        cats: [],
        nfts: [],
      });
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async createAccountBySerial({ state, dispatch, rootState }, name: string) {
      const seedLen = rootState.vault.seedMnemonic.trim().split(" ").length;
      if (seedLen != 12 && seedLen != 24) throw new Error("Wrong root mnemonic length, only accept with 12/24 words.");
      const serial = Math.max(...state.accounts.map((_) => (_.serial ? _.serial : 0)), 0) + 1;
      const acc = (seedLen == 24 && serial == 1)
        ? await account.getAccount("", null, rootState.vault.seedMnemonic)
        : await account.getAccount(rootState.vault.seedMnemonic, serial.toFixed(0));
      state.accounts.push({
        key: acc,
        name: name,
        type: "Serial",
        serial: serial,
        tokens: {},
        addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
        cats: [],
        nfts: [],
      });
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async createAccountByLegacyMnemonic({ state, dispatch }, { name, legacyMnemonic }: { name: string, legacyMnemonic: string }) {
      const acc = await account.getAccount("", null, legacyMnemonic);
      if (state.accounts.find(a => a.key.fingerprint === acc.fingerprint)) {
        throw new Error("account with same fingerprint already exists");
      }
      state.accounts.push({
        key: acc,
        name: name,
        type: "Legacy",
        tokens: {},
        addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
        cats: [],
        nfts: [],
      });
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    renameAccount(
      { state, dispatch },
      { idx, name }: { idx: number; name: string }
    ) {
      // following two assignment failed to update value;
      // state.accounts[idx].name == name;
      // state.accounts[idx] == Object.assign({}, state.accounts[idx], { name });
      state.accounts.splice(
        idx,
        1,
        Object.assign({}, state.accounts[idx], { name })
      );
      dispatch("persistent");
    },
    removeAccount({ state, dispatch }, idx: number) {
      state.accounts.splice(idx, 1);
      dispatch("persistent");
    },
    async refreshBalance({ state }, parameters: { idx: number, maxId: number }) {
      if (state.refreshing) return;
      state.refreshing = true;
      const to = setTimeout(function () { state.refreshing = false; }, 30000);
      function resetState() {
        clearTimeout(to);
        state.refreshing = false;
      }
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1 };
      let { idx, maxId } = parameters;
      if (typeof idx !== 'number' || idx <= 0) idx = state.selectedAccount;
      const account = state.accounts[idx];
      if (!account) {
        resetState();
        return;
      }
      if (typeof maxId !== 'number' || maxId <= 0) maxId = account.addressRetrievalCount;
      if (typeof maxId !== 'number' || maxId <= 0) DEFAULT_ADDRESS_RETRIEVAL_COUNT;

      const cats = account.cats.filter(c => c.network == store.state.network.networkId);
      const requests = await receive.getAssetsRequestDetail(account.key.privateKey, maxId, cats);

      try {
        const records = (await receive.getCoinRecords(requests, true));
        const activities = receive.convertActivities(requests, records);
        const tokenBalances = receive.getTokenBalance(requests, records);

        Vue.set(account, "activities", activities);
        Vue.set(account, "tokens", tokenBalances);
      }
      catch (error) {
        console.warn("error get account balance", error);
        const tokenBalances: AccountTokens = {};
        for (let i = 0; i < requests.length; i++) {
          const token = requests[i];
          tokenBalances[token.symbol] = {
            amount: -1n,
            addresses: token.puzzles.map(_ => ({ address: _.address, coins: [] })),
          }
        }
        Vue.set(account, "tokens", tokenBalances);
      }

      resetState();
    },
    async refreshNfts({ state }, parameters: { idx: number, maxId: number }) {
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1 };
      let { idx, maxId } = parameters;
      if (typeof idx !== 'number' || idx <= 0) idx = state.selectedAccount;
      const account = state.accounts[idx];
      if (!account) return;
      if (typeof maxId !== 'number' || maxId <= 0) maxId = account.addressRetrievalCount;
      if (typeof maxId !== 'number' || maxId <= 0) DEFAULT_ADDRESS_RETRIEVAL_COUNT;

      const requests = await receive.getAssetsRequestDetail(account.key.privateKey, maxId, []);
      const hintRecords = (await receive.getCoinRecords(requests, false, true));
      const nfts = await receive.getNfts(hintRecords);
      Vue.set(account, "nfts", nfts);
    },
  },
});
