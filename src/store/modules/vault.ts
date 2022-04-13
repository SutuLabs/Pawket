import store, { IRootState } from '@/store'
import utility from '../../services/crypto/utility';
import { AccountEntity } from './account';
import Vue from 'vue';
import encryption from '@/services/crypto/encryption';
import puzzle from '@/services/crypto/puzzle';
import i18n, { tc } from '@/i18n/i18n';
import UniStorage from '@/services/storage';
import { CurrencyType } from '@/services/exchange/currencyType';

export interface IVaultState {
  passwordHash: string;
  encryptedSeed: string;
  encryptedAccounts: string;
  password: string;
  seedMnemonic: string;
  unlocked: boolean;
  loading: boolean;
  experiment: boolean;
  currency: CurrencyType;
}

store.registerModule<IVaultState>('vault', {
  state() {
    return {
      seedMnemonic: "",
      passwordHash: "",
      encryptedSeed: "",
      encryptedAccounts: "",
      password: "",
      unlocked: false,
      loading: true,
      experiment: false,
      currency: CurrencyType.USDT,
    };
  },
  actions: {
    async initState({ state, rootState }) {
      const ustore = UniStorage.create();

      await store.dispatch("initializeBls");
      await store.dispatch("initializeClvm");

      const locale = await UniStorage.create().getItem("Locale")
      if (locale) i18n.locale = locale;

      const memsetting = await ustore.getItem("MEMORY_STATE");

      if (ustore.type == "background" && memsetting) {
        const sts = JSON.parse(memsetting) as IRootState;
        rootState.account = sts.account;
        rootState.account.refreshing = false;
        rootState.network = sts.network;
        rootState.vault = sts.vault;
        rootState.app.selfTestStatus = sts.app.selfTestStatus;
        rootState.app.debug = sts.app.debug;
        state.loading = false;
      }

      if (state.loading) {
        const value = await ustore.getItem("SETTINGS");
        const sts = JSON.parse(value || "{}") as IVaultState;
        state.passwordHash = sts.passwordHash;
        state.encryptedSeed = sts.encryptedSeed;
        state.encryptedAccounts = sts.encryptedAccounts;
        state.experiment = sts.experiment;
        state.currency = sts.currency;
        state.loading = false;
      }

      await store.dispatch("selfTest");
    },
    async importSeed({ state, dispatch }, mnemonic: string) {
      const seedLen = mnemonic.trim().split(" ").length;
      if (seedLen != 12 && seedLen != 24) throw new Error("Only accept mnemonic with 12/24 words.");
      state.seedMnemonic = mnemonic;
      await dispatch("persistent");
      await dispatch("createAccountBySerial", tc('default.accountName'));
      await dispatch("refreshBalance");
    },
    setPassword({ state, dispatch }, password: string) {
      utility.hash(password).then((pswhash) => {
        state.passwordHash = pswhash;
        dispatch("unlock", password);
      });
    },
    setCurrency({ state, dispatch }, currency: CurrencyType) {
      state.currency = currency;
      dispatch("persistent");
    },
    async changePassword({ state, dispatch }, { oldPassword, newPassword }: { oldPassword: string, newPassword: string }) {
      const pswhash = await utility.hash(oldPassword);
      if (pswhash != state.passwordHash) return;

      state.passwordHash = await utility.hash(newPassword);
      state.password = newPassword;
      await dispatch("persistent");
    },
    async initWalletAddress({ rootState }) {
      for (let i = 0; i < rootState.account.accounts.length; i++) {
        const account = rootState.account.accounts[i];
        const privkey = utility.fromHexString(account.key.privateKey);
        const derive = await utility.derive(privkey, true);
        const firstWalletAddressPubkey = utility.toHexString(
          derive([12381, 8444, 2, 0]).get_g1().serialize()
        );
        Vue.set(account, "firstAddress", await puzzle.getAddress(firstWalletAddressPubkey, rootState.network.networks[rootState.network.network].prefix));
      }
    },
    async unlock({ state, dispatch, rootState }, password) {
      const pswhash = await utility.hash(password);
      if (pswhash != state.passwordHash) return;
      rootState.account.accounts = JSON.parse(
        (await encryption.decrypt(state.encryptedAccounts, password)) || "[]"
      );
      rootState.account.accounts.forEach(_ => {
        Vue.set(_, "balance", -1);
        Vue.set(_, "activities", []);
      });
      state.seedMnemonic = await encryption.decrypt(
        state.encryptedSeed,
        password
      );
      state.password = password;
      state.unlocked = true;
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async lock({ state, dispatch, rootState }) {
      await dispatch("persistent");
      rootState.account.accounts = [];
      state.password = "";
      state.seedMnemonic = "";
      state.unlocked = false;
      await dispatch("saveState");
    },
    async persistent({ state, rootState, dispatch }) {
      if (!state.unlocked) return;
      if (!state.password || !state.seedMnemonic)
        console.warn("abnormal situration, password or seed mnemonic is empty!!!");
      const encryptedSeed = await encryption.encrypt(
        state.seedMnemonic,
        state.password
      )
      const encryptedAccounts = await encryption.encrypt(
        JSON.stringify(rootState.account.accounts.map(_ => (<AccountEntity>{
          key: _.key,
          name: _.name,
          type: _.type,
          serial: _.serial,
          addressRetrievalCount: _.addressRetrievalCount,
          cats: _.cats,
        }))), state.password
      )
      state.encryptedAccounts = encryptedAccounts;
      state.encryptedSeed = encryptedSeed;

      const ustore = UniStorage.create();
      await ustore.setItem("SETTINGS",
        JSON.stringify({
          encryptedSeed: encryptedSeed,
          passwordHash: state.passwordHash,
          encryptedAccounts: encryptedAccounts,
          network: rootState.network.network,
          experiment: state.experiment,
          currency: state.currency,
        })
      );

      await dispatch("saveState");
    },
    async saveState({ rootState }) {
      const ustore = UniStorage.create();
      if (ustore.type == "background") {
        await ustore.setItem("MEMORY_STATE", JSON.stringify({
          account: rootState.account,
          network: rootState.network,
          vault: rootState.vault,
          app: {
            debug: rootState.app.debug,
            selfTestStatus: rootState.app.selfTestStatus == "Passed" ? "Passed" : "Checking",
          }
        }));
      }
    },
    async clear() {
      const ustore = UniStorage.create();
      await ustore.removeItem("SETTINGS")
      await ustore.removeItem("MEMORY_STATE")
      location.reload();
    },

  },
});
