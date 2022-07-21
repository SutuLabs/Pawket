import store from "@/store";
import account, { AccountKey } from "@/services/crypto/account";
import Vue from "vue";
import receive, { TokenPuzzleAddress, TokenPuzzleDetail } from "@/services/crypto/receive";
import { rpcUrl, xchPrefix, xchSymbol } from "./network";
import { AccountEntity, AccountTokens, AccountType, CustomCat, TokenInfo } from "@/models/account";
import { DEFAULT_ADDRESS_RETRIEVAL_COUNT, getAccountAddressDetails as getAccountAddressDetailsExternal } from "@/services/util/account";

export function getAccountCats(account: AccountEntity): CustomCat[] {
  return account.allCats?.filter((c) => c.network == store.state.network.networkId) ?? [];
}

export function getDefaultCats(): CustomCat[] {
  const list: CustomCat[] = [];
  for (const key in store.state.account.tokenInfo) {
    list.push({
      name: store.state.account.tokenInfo[key].symbol,
      id: store.state.account.tokenInfo[key].id ?? xchSymbol(),
      img: store.state.account.tokenInfo[key].img,
    });
  }
  return list;
}

export function getAllCats(account: AccountEntity): CustomCat[] {
  const defaultCats = getDefaultCats();
  return defaultCats.concat(getAccountCats(account));
}

export interface IAccountState {
  selectedAccount: number;
  accounts: AccountEntity[];
  tokenInfo: TokenInfo;
  refreshing: boolean;
  offline: boolean;
}

store.registerModule<IAccountState>("account", {
  state() {
    return {
      tokenInfo: {},
      accounts: [],
      selectedAccount: 0,
      refreshing: false,
      offline: false,
    };
  },
  actions: {
    async createAccountByPassword({ state, dispatch, rootState }, { password, name }: { password: string; name: string }) {
      const acc = await account.getAccount(rootState.vault.seedMnemonic, password);
      if (state.accounts.find((a) => a.key.fingerprint === acc.fingerprint)) {
        throw new Error("account with same fingerprint already exists");
      }
      state.accounts.push(getAccountEntity(acc, name, "Password"));
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async createAccountBySerial({ state, dispatch, rootState }, name: string) {
      const seedLen = rootState.vault.seedMnemonic.trim().split(" ").length;
      if (seedLen != 12 && seedLen != 24) throw new Error("Wrong root mnemonic length, only accept with 12/24 words.");
      const serial = Math.max(...state.accounts.map((_) => (_.serial ? _.serial : 0)), 0) + 1;
      const acc =
        seedLen == 24 && serial == 1
          ? await account.getAccount("", null, rootState.vault.seedMnemonic)
          : await account.getAccount(rootState.vault.seedMnemonic, serial.toFixed(0));
      state.accounts.push(getAccountEntity(acc, name, "Serial", serial));
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async createAccountByLegacyMnemonic({ state, dispatch }, { name, legacyMnemonic }: { name: string; legacyMnemonic: string }) {
      const acc = await account.getAccount("", null, legacyMnemonic);
      if (state.accounts.find((a) => a.key.fingerprint === acc.fingerprint)) {
        throw new Error("account with same fingerprint already exists");
      }
      state.accounts.push(getAccountEntity(acc, name, "Legacy"));
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async createAccountByAddress({ state, dispatch }, { name, puzzleHash }: { name: string; puzzleHash: string }) {
      state.accounts.push(
        getAccountEntity({ compatibleMnemonic: "", fingerprint: -1, privateKey: "" }, name, "Address", undefined, puzzleHash)
      );
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    renameAccount({ state, dispatch }, { idx, name }: { idx: number; name: string }) {
      // following two assignment failed to update value;
      // state.accounts[idx].name == name;
      // state.accounts[idx] == Object.assign({}, state.accounts[idx], { name });
      state.accounts.splice(idx, 1, Object.assign({}, state.accounts[idx], { name }));
      dispatch("persistent");
    },
    removeAccount({ state, dispatch }, idx: number) {
      if (idx == state.selectedAccount) state.selectedAccount = 0;
      if (idx < state.selectedAccount) state.selectedAccount--;
      state.accounts.splice(idx, 1);
      dispatch("persistent");
    },
    async refreshBalance({ state }, parameters: { idx: number; maxId: number }) {
      if (state.refreshing) return;
      state.refreshing = true;
      const to = setTimeout(function () {
        state.refreshing = false;
      }, 30000);
      function resetState() {
        clearTimeout(to);
        state.refreshing = false;
      }
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1 };
      let idx = parameters.idx;
      if (typeof idx !== "number" || idx <= 0) idx = state.selectedAccount;
      const account = state.accounts[idx];
      if (!account) {
        resetState();
        return;
      }
      const requests: TokenPuzzleAddress[] =
        account.type == "Address"
          ? <TokenPuzzleAddress[]>[
            { symbol: xchSymbol(), puzzles: [{ hash: account.puzzleHash, type: "Unknown", address: account.firstAddress }] },
          ]
          : await getAccountAddressDetails(account, parameters.maxId);

      try {
        const records = await receive.getCoinRecords(requests, true, rpcUrl());
        const activities = receive.convertActivities(requests, records);
        const tokenBalances = receive.getTokenBalance(requests, records);

        Vue.set(account, "activities", activities);
        Vue.set(account, "tokens", tokenBalances);
        state.offline = false;
      } catch (error) {
        console.warn("error get account balance", error);
        if (!account.tokens || !account.tokens[requests[0].symbol]) {
          const tokenBalances: AccountTokens = {};
          for (let i = 0; i < requests.length; i++) {
            const token = requests[i];
            tokenBalances[token.symbol] = {
              amount: -1n,
              addresses: token.puzzles.map((_) => ({ address: _.address, type: _.type, coins: [] })),
            };
          }
          Vue.set(account, "tokens", tokenBalances);
        }
        state.offline = true;
      }

      resetState();
    },
    async refreshNfts({ state }, parameters: { idx: number; maxId: number }) {
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1 };
      let idx = parameters.idx;
      if (typeof idx !== "number" || idx <= 0) idx = state.selectedAccount;
      const account = state.accounts[idx];
      if (!account) return;

      const requests = await getAccountAddressDetails(account, parameters.maxId);
      const hintRecords = await receive.getCoinRecords(requests, false, rpcUrl(), true);
      const nfts = await receive.getNfts(hintRecords, rpcUrl());
      Vue.set(account, "nfts", nfts);
    },
    async refreshAddress({ state }, parameters: { idx: number; maxId: number }) {
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1 };
      let idx = parameters.idx;
      if (typeof idx !== "number" || idx <= 0) idx = state.selectedAccount;
      const account = state.accounts[idx];
      if (!account) return;

      const puzzleAddress: TokenPuzzleAddress[] = await getAccountAddressDetails(account, parameters.maxId);
      const xidx = puzzleAddress.findIndex((p) => (p.symbol = xchSymbol()));
      const addresses = puzzleAddress[xidx].puzzles.map((_) => ({ address: _.address, type: _.type, coins: [] }));
      account.tokens[xchSymbol()].addresses = addresses;
    },
  },
});

function getAccountEntity(
  account: AccountKey,
  name: string,
  type: AccountType,
  serial: number | undefined = undefined,
  puzzleHash: string | undefined = undefined
): AccountEntity {
  return {
    puzzleHash,
    key: account,
    name: name,
    type: type,
    serial: serial,
    tokens: {},
    addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
    allCats: [],
    nfts: [],
    addressGenerated: 0,
    addressPuzzles: [],
  };
}

export async function getAccountAddressDetails(
  account: AccountEntity,
  maxId: number | undefined = undefined
): Promise<TokenPuzzleDetail[]> {
  return await getAccountAddressDetailsExternal(account, getAccountCats(account), store.state.account.tokenInfo, xchPrefix(), xchSymbol(), maxId);
}