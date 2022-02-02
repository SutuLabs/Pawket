import Vue from "vue";
import Vuex from "vuex";
import utility from "./utility";
import { AccountKey } from "@/store/utility";
import { CoinRecord, GetRecordsResponse } from "@/models/walletModel";
import * as clvm_tools from "clvm_tools/browser";

Vue.use(Vuex);

type AccountType = "Serial" | "Password";

export interface Account {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
  firstAddress?: string;
  activities?: CoinRecord[];
  tokens: { [symbol: string]: number };
}

export interface PersistentAccount {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
}

export interface NetworkDetail {
  name: string;
  rpc: string;
  prefix: string;
}

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
    importSeed({ state, dispatch }, mnemonic: string) {
      state.seedMnemonic = mnemonic;
      dispatch("persistent");
      dispatch("createAccountBySerial", "Default");
    },
    setPassword({ state, dispatch }, password: string) {
      utility.hash(password).then((pswhash) => {
        state.passwordHash = pswhash;
        dispatch("unlock", password);
      });
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
            JSON.stringify(state.accounts.map(_ => ({
              key: _.key,
              name: _.name,
              type: _.type,
              serial: _.serial,
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
        state.accounts.push({ key: account, name: name, type: "Password", tokens: {} });
        dispatch("initWalletAddress");
        dispatch("persistent");
      });
    },
    createAccountBySerial({ state, dispatch }, name: string) {
      const serial =
        Math.max(...state.accounts.map((_) => (_.serial ? _.serial : 0)), 0) +
        1;
      utility
        .getAccount(state.seedMnemonic, serial.toFixed(0))
        .then((account) => {
          state.accounts.push({
            key: account,
            name: name,
            type: "Serial",
            serial: serial,
            tokens: {},
          });
          dispatch("initWalletAddress");
          dispatch("persistent");
        });
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
    async refreshBalance({ state }, idx: number) {
      if (!idx) idx = state.selectedAccount;
      const account = state.accounts[idx];
      const privkey = utility.fromHexString(account.key.privateKey);
      const xchToken = { symbol: "XCH", hashes: await utility.getPuzzleHashes(privkey, 0, 1) };
      const tokens = [xchToken];
      const sbxId = "78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1";
      const bshId = "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b";
      const ch21Id = "509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8f";
      const assets = [
        { symbol: "BSH", id: bshId },
        { symbol: "SBX", id: sbxId },
        { symbol: "CH21", id: ch21Id }
      ];
      const dictAssets: { [key: string]: string } = {};
      for (let i = 0; i < xchToken.hashes.length; i++) {
        const h = xchToken.hashes[i];
        dictAssets[h] = xchToken.symbol;
      }
      for (let i = 0; i < assets.length; i++) {
        const assetId = assets[i].id;
        const symbol = assets[i].symbol;
        const hs = await utility.getCatPuzzleHashes(privkey, assetId, 0, 1);
        tokens.push(Object.assign({}, assets[i], { hashes: hs }));
        for (let j = 0; j < hs.length; j++) {
          const h = hs[j];
          dictAssets[h] = symbol;
        }
      }

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
      const tokenBalances: { [symbol: string]: number } = {};
      for (let i = 0; i < balances.length; i++) {
        const b = balances[i];
        tokenBalances[b.symbol] = b.amount;
      }

      Vue.set(account, "activities", activities);

      Vue.set(account, "tokens", tokenBalances);
    }
  },
  modules: {},
});
