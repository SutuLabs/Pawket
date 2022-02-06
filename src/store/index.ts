import Vue from "vue";
import Vuex from "vuex";
import utility from "./utility";
import { AccountKey } from "@/store/utility";
import { CoinRecord, GetRecordsResponse } from "@/models/walletModel";
import * as clvm_tools from "clvm_tools/browser";

Vue.use(Vuex);

const DEFAULT_ADDRESS_RETRIEVAL_COUNT = 4;

type AccountType = "Serial" | "Password" | "Legacy";

export interface AccountToken {
  amount: number; addresses: string[];
}
export interface AccountTokens {
  [symbol: string]: AccountToken;
}

export interface Account {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
  firstAddress?: string;
  activities?: CoinRecord[];
  tokens: AccountTokens;
  addressRetrievalCount: number;
  cats: CustomCat[];
}

export interface CustomCat {
  name: string;
  id: string;
}

export interface PersistentAccount {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
  addressRetrievalCount: number;
  cats: CustomCat[];
}

export interface NetworkDetail {
  name: string;
  rpc: string;
  prefix: string;
}
export interface TokenInfo {
  [symbol: string]: {
    id?: string,
    symbol: string,
    decimal: number,
    unit: string,
  }
};

export interface VuexState {
  seedMnemonic: string;
  passwordHash: string;
  encryptedSeed: string;
  encryptedAccounts: string;
  metamaskAccount: string;
  selectedAccount: number;
  password: string;
  accounts: Account[];
  unlock: boolean;
  network: string;
  networks: { [key: string]: NetworkDetail };
  clvmInitialized: boolean;
  tokenInfo: TokenInfo;
  refreshing: boolean;
  debug: boolean;
  externalExplorerPrefix: string;
}

export default new Vuex.Store<VuexState>({
  state() {
    const sts = JSON.parse(localStorage.getItem("SETTINGS") || "{}");

    return <VuexState>{
      seedMnemonic: "",
      passwordHash: sts.passwordHash,
      encryptedSeed: sts.encryptedSeed,
      encryptedAccounts: sts.encryptedAccounts,
      metamaskAccount: "",
      password: "",
      accounts: [],
      selectedAccount: 0,
      unlock: false,
      network: sts.network || "main",
      networks: {
        testnet10: {
          name: "testnet10",
          rpc: "",
          prefix: "txch"
        },
        main: {
          name: "Main",
          rpc: "",
          prefix: "xch"
        },
      },
      clvmInitialized: false,
      tokenInfo: {
        "XCH": {
          symbol: "XCH",
          decimal: 12,
          unit: "XCH",
        },
        "BSH": {
          id: "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b",
          symbol: "BSH",
          decimal: 3,
          unit: "BSH",
        },
        // "SBX": {
        //   id: "78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1",
        //   symbol: "SBX",
        //   decimal: 3,
        //   unit: "SBX",
        // },
        // "CH21": {
        //   id: "509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8f",
        //   symbol: "CH21",
        //   decimal: 3,
        //   unit: "CH21",
        // },
      },
      externalExplorerPrefix: 'https://chia.tt/info/address/',
      refreshing: false,
      debug: false,
    };
  },
  getters: {},
  mutations: {},
  actions: {
    async initializeClvm({ state }) {
      if (state.clvmInitialized) return;
      await clvm_tools.initialize();
      state.clvmInitialized = true;
    },
    copy({ state }, text: string) {
      utility.copy(text);
    },
    async importSeed({ state, dispatch }, mnemonic: string) {
      state.seedMnemonic = mnemonic;
      await dispatch("persistent");
      await dispatch("createAccountBySerial", "Default");
      await dispatch("refreshBalance");
    },
    setPassword({ state, dispatch }, password: string) {
      utility.hash(password).then((pswhash) => {
        state.passwordHash = pswhash;
        dispatch("unlock", password);
      });
    },
    async changePassword({ state, dispatch }, { oldPassword, newPassword }: { oldPassword: string, newPassword: string }) {
      const pswhash = await utility.hash(oldPassword);
      if (pswhash != state.passwordHash) return;

      state.passwordHash = await utility.hash(newPassword);
      state.password = newPassword;
      await dispatch("persistent");
    },
    async initWalletAddress({ state }) {
      for (let i = 0; i < state.accounts.length; i++) {
        const account = state.accounts[i];
        const privkey = utility.fromHexString(account.key.privateKey);
        const derive = await utility.derive(privkey);
        const firstWalletAddressPubkey = utility.toHexString(
          derive([12381, 8444, 2, 0]).get_g1().serialize()
        );
        Vue.set(account, "firstAddress", await utility.getAddress(firstWalletAddressPubkey, state.networks[state.network].prefix));
      }
    },
    unlock({ state, dispatch }, password) {
      utility.hash(password).then(async (pswhash) => {
        if (pswhash != state.passwordHash) return;
        state.password = password;
        state.accounts = JSON.parse(
          (await utility.decrypt(state.encryptedAccounts, password)) || "[]"
        );
        state.accounts.forEach(_ => {
          Vue.set(_, "balance", -1);
          Vue.set(_, "activities", []);
        });
        state.seedMnemonic = await utility.decrypt(
          state.encryptedSeed,
          password
        );
        state.unlock = true;
        dispatch("initWalletAddress");
        dispatch("persistent");
      });
    },
    async lock({ state, dispatch }) {
      await dispatch("persistent");
      state.accounts = [];
      state.password = "";
      state.seedMnemonic = "";
      state.unlock = false;
    },
    async persistent({ state }) {
      if (!state.unlock) return;
      localStorage.setItem(
        "SETTINGS",
        JSON.stringify({
          encryptedSeed: await utility.encrypt(
            state.seedMnemonic,
            state.password
          ),
          passwordHash: state.passwordHash,
          encryptedAccounts: await utility.encrypt(
            JSON.stringify(state.accounts.map(_ => (<Account>{
              key: _.key,
              name: _.name,
              type: _.type,
              serial: _.serial,
              addressRetrievalCount: _.addressRetrievalCount,
              cats: _.cats,
            }))),
            state.password
          ),
          network: state.network,
        })
      );
    },
    clear() {
      localStorage.removeItem("SETTINGS");
      location.reload();
    },
    createAccountByPassword(
      { state, dispatch },
      { password, name }: { password: string; name: string }
    ) {
      utility.getAccount(state.seedMnemonic, password).then((account) => {
        state.accounts.push({
          key: account,
          name: name,
          type: "Password",
          tokens: {},
          addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
          cats: [],
        });
        dispatch("initWalletAddress");
        dispatch("persistent");
      });
    },
    async createAccountBySerial({ state, dispatch }, name: string) {
      const serial = Math.max(...state.accounts.map((_) => (_.serial ? _.serial : 0)), 0) + 1;
      const account = await utility.getAccount(state.seedMnemonic, serial.toFixed(0));
      state.accounts.push({
        key: account,
        name: name,
        type: "Serial",
        serial: serial,
        tokens: {},
        addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
        cats: [],
      });
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async createAccountByLegacyMnemonic({ state, dispatch }, { name, legacyMnemonic }: { name: string, legacyMnemonic: string }) {
      const account = await utility.getAccount("", null, legacyMnemonic);
      state.accounts.push({
        key: account,
        name: name,
        type: "Legacy",
        tokens: {},
        addressRetrievalCount: DEFAULT_ADDRESS_RETRIEVAL_COUNT,
        cats: [],
      });
      dispatch("initWalletAddress");
      dispatch("persistent");
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
    // removeAccount({ state }, accountName: string) {
    //   state.accounts.splice(state.accounts.findIndex(_ => _.name == accountName), 1);
    // },
    async refreshBalance({ state }, parameters: { idx: number, maxId: number }) {
      if (state.refreshing) return;
      state.refreshing = true;
      const to = setTimeout(function () { state.refreshing = false; }, 30000);
      function resetState() {
        clearTimeout(to);
        state.refreshing = false;
      }
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: DEFAULT_ADDRESS_RETRIEVAL_COUNT };
      let { idx, maxId } = parameters;
      if (typeof idx !== 'number' || idx <= 0) idx = state.selectedAccount;
      if (typeof maxId !== 'number' || maxId <= 0) maxId = DEFAULT_ADDRESS_RETRIEVAL_COUNT;
      const account = state.accounts[idx];
      if (!account) {
        resetState();
        return;
      }

      const privkey = utility.fromHexString(account.key.privateKey);
      const xchToken = { symbol: "XCH", hashes: await utility.getPuzzleHashes(privkey, 0, maxId) };
      const tokens = [xchToken];
      const standardAssets = Object.values(state.tokenInfo).filter(_ => _.id).map(_ => ({ symbol: _.symbol, id: _.id ?? "" }));
      const accountAssets = (account.cats ?? []).map(_ => ({ symbol: _.name, id: _.id }))
      const assets = standardAssets.concat(accountAssets);

      const dictAssets: { [key: string]: string } = {};
      for (let i = 0; i < xchToken.hashes.length; i++) {
        const h = xchToken.hashes[i];
        dictAssets[h] = xchToken.symbol;
      }
      for (let i = 0; i < assets.length; i++) {
        const assetId = assets[i].id;
        const symbol = assets[i].symbol;
        const hs = await utility.getCatPuzzleHashes(privkey, assetId, 0, maxId);
        tokens.push(Object.assign({}, assets[i], { hashes: hs }));
        for (let j = 0; j < hs.length; j++) {
          const h = hs[j];
          dictAssets[h] = symbol;
        }
      }

      try {
        const hashes = tokens.reduce((acc, token) => acc.concat(token.hashes), ([] as string[]));

        const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/records", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            puzzleHashes: hashes,
            includeSpentCoins: true,
          }),
        });
        const json = (await resp.json()) as GetRecordsResponse;
        const activities = json.coins.reduce(
          (acc, puzzle) => acc.concat(puzzle.records
            .reduce<CoinRecord[]>((recacc, rec) => recacc.concat(rec), [])
            .map(rec => Object.assign({}, rec, { symbol: dictAssets[puzzle.puzzleHash] }))),
          ([] as CoinRecord[]));

        const balances = tokens.map(token => ({
          symbol: token.symbol,
          amount: activities
            .filter(act => act.symbol == token.symbol)
            .reduce((recacc, rec) => recacc + ((!rec.coin || rec.spent) ? 0 : rec.coin.amount), 0)
        }))
        const tokenBalances: AccountTokens = {};
        for (let i = 0; i < balances.length; i++) {
          const b = balances[i];
          tokenBalances[b.symbol] = {
            amount: b.amount,
            addresses: await utility.getAddressesFromPuzzleHash(tokens.find(_ => _.symbol == b.symbol)?.hashes ?? [], "xch"),
          };
        }

        Vue.set(account, "activities", activities);
        Vue.set(account, "tokens", tokenBalances);
      }
      catch (error) {
        console.warn("error get account balance", error);
        const tokenBalances: AccountTokens = {};
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          tokenBalances[token.symbol] = {
            amount: -1,
            addresses: await utility.getAddressesFromPuzzleHash(token.hashes, "xch"),
          }
        }
        Vue.set(account, "tokens", tokenBalances);
      }

      resetState();
    }
  },
  modules: {},
});
