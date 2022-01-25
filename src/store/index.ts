import Vue from "vue";
import Vuex from "vuex";
import utility from "./utility";

Vue.use(Vuex);

type AccountType = 'Serial' | 'Password';

interface Account {
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
      unlock: false,
    };
  },
  getters: {},
  mutations: {},
  actions: {
    importSeed({ state, dispatch }, mnemonic: string) {
      state.seedMnemonic = mnemonic;
      dispatch('persistent')
    },
    setPassword({ state, dispatch }, password: string) {
      state.passwordHash = utility.hash(password);
      dispatch('unlock', password);
    },
    unlock({ state, dispatch }, password) {
      if (utility.hash(password) != state.passwordHash) return;
      state.password = password;
      state.accounts = utility.decrypt(state.encryptedAccounts, password);
      state.seedMnemonic = utility.decrypt(state.encryptedSeed, password);
      state.unlock = true;
      dispatch('persistent')
    },
    persistent({ state }) {
      if (!state.unlock) return;
      localStorage.setItem("SETTINGS", JSON.stringify({
        encryptedSeed: utility.encrypt(state.seedMnemonic, state.password),
        passwordHash: state.passwordHash,
        encryptedAccounts: utility.encrypt(JSON.stringify(state.accounts), state.password),
      }));
    },
    createAccountByPassword({ state }, password: string, name: string) {
      const account = utility.getAccount(state.seedMnemonic, password);
      state.accounts.push({ key: account, name: name, type: 'Password' });
    },
    createAccountBySerial({ state }, name: string) {
      serial = Math.max(...state.accounts.map(_ => _.serial), 0) + 1;
      const account = utility.getAccount(state.seedMnemonic, serial);
      state.accounts.push({ key: account, name: name, type: 'Serial', serial: serial });
    },
    removeAccount({ state }, accountName: string) {
      const account = utility.getAccount(state.seedMnemonic, password);
      state.accounts.splice(state.accounts.findIndex(_ => _.name == accountName), 1);
    },

  },
  modules: {},
});
