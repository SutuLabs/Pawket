import Vue from "vue";
import Vuex from "vuex";
import utility from "./utility";
import { AccountKey } from "@/store/utility";

Vue.use(Vuex);

type AccountType = "Serial" | "Password";

export interface Account {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
  firstAddress?: string;
  balance: number;
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
    };
  },
  getters: {},
  mutations: {},
  actions: {
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
        const privkey = new Uint8Array(
          Object.assign([], account.key.privateKey)
        );
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
            JSON.stringify(state.accounts),
            state.password
          ),
          network: state.network,
        })
      );
    },
    clear({ state }) {
      localStorage.removeItem("SETTINGS");
      location.reload();
    },
    createAccountByPassword(
      { state, dispatch },
      { password, name }: { password: string; name: string }
    ) {
      utility.getAccount(state.seedMnemonic, password).then((account) => {
        state.accounts.push({ key: account, name: name, type: "Password", balance: -1 });
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
            balance: -1,
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
    async refreshBalance({ state, dispatch }, idx: number) {
      if (!idx) idx = state.selectedAccount;
      const account = state.accounts[idx];
      const privkey = new Uint8Array(
        Object.assign([], account.key.privateKey)
      );
      const hashes = await utility.getPuzzleHashes(privkey, state.networks[state.network].prefix, 0, 1);

      const resp = await fetch("https://10.177.0.165:5058/Wallet/records", {
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
      const balance = json.coins.reduce(
        (acc, puzzle) =>
          acc +
          puzzle.records.reduce(
            (recacc, rec) =>
              recacc + ((!rec.coin || rec.spent) ? 0 : rec.coin.amount),
            0
          ),
        0
      );

      // json.coins.forEach(c => {
      //   c.records.forEach(r => {
      //     console.log("coin", r.coin.amount, r.coin.parentCoinInfo, r.coin.puzzleHash)
      //   });
      // });

      Vue.set(account, "balance", balance);
    }
  },
  modules: {},
});
