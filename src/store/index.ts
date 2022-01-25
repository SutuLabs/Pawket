import Vue from "vue";
import Vuex from "vuex";
import utility from "./utility";
import { AccountKey } from "@/store/utility";

Vue.use(Vuex);

type AccountType = 'Serial' | 'Password';

export interface Account {
  key: AccountKey;
  name: string;
  type: AccountType;
  serial?: number;
}

interface VuexState {
  seedMnemonic: string;
  passwordHash: string;
  encryptedSeed: string;
  encryptedAccounts: string;
  metamaskAccount: string;
  selectedAccount: number;
  password: string;
  accounts: Account[];
  unlock: boolean;
}

export default new Vuex.Store<VuexState>({
  state() {
    const sts = JSON.parse(localStorage.getItem("SETTINGS") || '{}');

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
      dispatch('persistent');
      dispatch('createAccountBySerial', 'Default');
    },
    setPassword({ state, dispatch }, password: string) {
      state.passwordHash = utility.hash(password);
      dispatch('unlock', password);
    },
    unlock({ state, dispatch }, password) {
      if (utility.hash(password) != state.passwordHash) return;
      state.password = password;
      state.accounts = JSON.parse(utility.decrypt(state.encryptedAccounts, password) || '[]');
      state.seedMnemonic = utility.decrypt(state.encryptedSeed, password);
      state.unlock = true;
      dispatch('persistent');
    },
    persistent({ state }) {
      if (!state.unlock) return;
      localStorage.setItem("SETTINGS", JSON.stringify({
        encryptedSeed: utility.encrypt(state.seedMnemonic, state.password),
        passwordHash: state.passwordHash,
        encryptedAccounts: utility.encrypt(JSON.stringify(state.accounts), state.password),
      }));
    },
    createAccountByPassword({ state, dispatch }, password: string, name: string) {
      utility.getAccount(state.seedMnemonic, password)
        .then((account) => {
          state.accounts.push({ key: account, name: name, type: 'Password' });
          dispatch('persistent');
        });
    },
    createAccountBySerial({ state, dispatch }, name: string) {
      const serial = Math.max(...state.accounts.map(_ => _.serial), 0) + 1;
      utility.getAccount(state.seedMnemonic, serial.toFixed(0))
        .then((account) => {
          console.log(state.accounts, account, serial, name);
          state.accounts.push({ key: account, name: name, type: 'Serial', serial: serial });
          dispatch('persistent');
        });
    },
    removeAccount({ state }, accountName: string) {
      state.accounts.splice(state.accounts.findIndex(_ => _.name == accountName), 1);
    },

  },
  modules: {},
});
