import store from '@/store'
import utility from '../../services/crypto/utility';
import { AccountEntity } from './account';
import Vue from 'vue';
import encryption from '@/services/crypto/encryption';
import puzzle from '@/services/crypto/puzzle';

export interface IVaultState {
  passwordHash: string;
  encryptedSeed: string;
  encryptedAccounts: string;
  password: string;
  seedMnemonic: string;
  unlocked: boolean;
}

store.registerModule<IVaultState>('vault', {
  state() {
    const sts = JSON.parse(localStorage.getItem("SETTINGS") || "{}");

    return {
      seedMnemonic: "",
      passwordHash: sts.passwordHash,
      encryptedSeed: sts.encryptedSeed,
      encryptedAccounts: sts.encryptedAccounts,
      password: "",
      unlocked: false,
    };
  },
  actions: {
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
    async initWalletAddress({ state, rootState }) {
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
      state.password = password;
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
    },
    async persistent({ state, rootState }) {
      if (!state.unlocked) return;
      if (!state.password || !state.seedMnemonic)
        console.warn("abnormal situration, password or seed mnemonic is empty!!!");

      localStorage.setItem(
        "SETTINGS",
        JSON.stringify({
          encryptedSeed: await encryption.encrypt(
            state.seedMnemonic,
            state.password
          ),
          passwordHash: state.passwordHash,
          encryptedAccounts: await encryption.encrypt(
            JSON.stringify(rootState.account.accounts.map(_ => (<AccountEntity>{
              key: _.key,
              name: _.name,
              type: _.type,
              serial: _.serial,
              addressRetrievalCount: _.addressRetrievalCount,
              cats: _.cats,
            }))),
            state.password
          ),
          network: rootState.network.network,
        })
      );
    },
    clear() {
      localStorage.removeItem("SETTINGS");
      location.reload();
    },

  },
});
