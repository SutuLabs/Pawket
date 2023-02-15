import store, { IRootState } from "@/store";
import utility from "../../services/crypto/utility";
import { PersistentAccount } from "@/models/account";
import Vue from "vue";
import encryption from "@/services/crypto/encryption";
import puzzle from "@/services/crypto/puzzle";
import i18n, { tc } from "@/i18n/i18n";
import UniStorage from "@/services/storage";
import { CurrencyType } from "@/services/exchange/currencyType";
import { xchPrefix } from "./network";
import router from "@/router";

export interface IVaultState {
  passwordHash: string;
  salt: string;
  encryptKey: string;
  encryptedSeed: string;
  encryptedAccounts: string;
  seedMnemonic: string;
  unlocked: boolean;
  loading: boolean;
  experiment: boolean;
  currency: CurrencyType;
  selectedAccount: number;
  offline: boolean;
  disconnected: boolean;
}

export const PasswordHashIteration = 6000;
export const EncryptKeyHashIteration = 3000;

store.registerModule<IVaultState>("vault", {
  state() {
    return {
      seedMnemonic: "",
      passwordHash: "",
      salt: "",
      encryptKey: "",
      encryptedSeed: "",
      encryptedAccounts: "",
      unlocked: false,
      loading: true,
      experiment: false,
      currency: CurrencyType.USDT,
      selectedAccount: 0,
      offline: false,
      disconnected: false
    };
  },
  actions: {
    async initState({ state, rootState }) {
      const ustore = UniStorage.create();

      await store.dispatch("switchNetwork");
      await store.dispatch("initializeBls");
      await store.dispatch("initializeClvm");

      const locale = await UniStorage.create().getItem("Locale");
      if (locale) i18n.locale = locale;

      const memsetting = await ustore.getItem("MEMORY_STATE");
      const offline = localStorage.getItem("OFFLINE_MODE");
      if (offline && offline == "on") state.offline = true;

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
        state.salt = sts.salt;
        state.encryptKey = sts.encryptKey;
        state.encryptedSeed = sts.encryptedSeed;
        state.encryptedAccounts = sts.encryptedAccounts;
        state.experiment = sts.experiment;
        state.currency = sts.currency;
        state.selectedAccount = sts.selectedAccount ?? 0;
        state.loading = false;
      }

      await store.dispatch("selfTest");
    },
    async importSeed({ state, dispatch }, mnemonic: string) {
      const seedLen = mnemonic.trim().split(" ").length;
      if (seedLen != 12 && seedLen != 24) throw new Error("Only accept mnemonic with 12/24 words.");
      state.seedMnemonic = mnemonic;
      await dispatch("persistent");
      if (seedLen == 24) {
        await dispatch("createAccountByLegacyMnemonic", {
            name: tc("default.accountName"),
            legacyMnemonic: mnemonic,
        });
      } else {
        await dispatch("createAccountBySerial", tc("default.accountName"));
      }
      await dispatch("refreshBalance");
    },
    async setPassword({ state, dispatch }, password: string) {
      state.unlocked = true;
      await dispatch("ensureSalt", password);
    },
    setCurrency({ state, dispatch }, currency: CurrencyType) {
      state.currency = currency;
      dispatch("persistent");
    },
    selectAccount({ state, dispatch }, account: number) {
      state.selectedAccount = account;
      dispatch("persistent");
    },
    async changePassword({ dispatch }, { oldPassword, newPassword }: { oldPassword: string; newPassword: string }) {
      if (!(await isPasswordCorrect(oldPassword))) return;

      await dispatch("ensureSalt", newPassword);
      await dispatch("persistent");
    },
    async initWalletAddress({ rootState }) {
      for (let i = 0; i < rootState.account.accounts.length; i++) {
        const account = rootState.account.accounts[i];
        if (account.type == "Address") {
          if (!account.puzzleHash) {
            console.warn(`Found malformat 'Address' account [${account.name}]`);
            continue;
          }
          Vue.set(account, "firstAddress", puzzle.getAddressFromPuzzleHash(account.puzzleHash, xchPrefix()));
          continue;
        }
        if (account.type == "PublicKey") {
          const pk = utility.fromHexString(account.key.publicKey);
          const derive = await utility.derivePk(pk);
          const firstWalletAddressPubkey = utility.toHexString(derive([12381, 8444, 2, 0]).serialize());
          Vue.set(account, "firstAddress", await puzzle.getAddress(firstWalletAddressPubkey, xchPrefix()));
          continue;
        }

        const privkey = utility.fromHexString(account.key.privateKey);
        const derive = await utility.derive(privkey, false);
        const firstWalletAddressPubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
        Vue.set(account, "firstAddress", await puzzle.getAddress(firstWalletAddressPubkey, xchPrefix()));
      }
    },
    async unlock({ state, dispatch, rootState }, password) {
      if (!(await isPasswordCorrect(password))) return;

      const salt = state.salt;
      const encryptKey = salt ? await getEncryptKey(password) : password;
      rootState.account.accounts = JSON.parse((await encryption.decrypt(state.encryptedAccounts, encryptKey)) || "[]");
      rootState.account.selectedAccount = state.selectedAccount;
      ensureState(rootState);
      rootState.account.accounts.forEach((_) => {
        _.cats?.forEach((c) => _.allCats.push({ name: c.name, id: c.id, network: "mainnet" }));
        Vue.set(_, "balance", -1);
        Vue.set(_, "activities", []);
      });
      state.unlocked = true;
      router.push("/home").catch(() => undefined);
      state.seedMnemonic = await encryption.decrypt(state.encryptedSeed, encryptKey);

      // initialize upgraded salt
      await dispatch("ensureSalt", password);
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    async ensureSalt({ state }, password) {
      if (!state.salt) {
        const array = new Uint8Array(16);
        self.crypto.getRandomValues(array);
        state.salt = utility.toHexString(array);
        // console.log("generate salt", state.salt, state.encryptKey);
      }
      state.encryptKey = await getEncryptKey(password);
      state.passwordHash = await getPasswordHash(password);
    },
    async lock({ state, dispatch, rootState }) {
      await dispatch("persistent");
      rootState.account.accounts = [];
      state.encryptKey = "";
      state.seedMnemonic = "";
      state.unlocked = false;
      await dispatch("saveState");
      router.push("/login").catch(() => undefined);
    },
    async persistent({ state, rootState, dispatch }) {
      if (!state.unlocked) return;
      if (!state.encryptKey || !state.seedMnemonic) console.warn("abnormal situation, encrypt key or seed mnemonic is empty!!!");
      const encryptedSeed = await encryption.encrypt(state.seedMnemonic, state.encryptKey);
      const encryptedAccounts = await encryption.encrypt(
        JSON.stringify(
          rootState.account.accounts.map(
            (_) =>
              <PersistentAccount>{
                key: _.key,
                name: _.name,
                profilePic: _.profilePic,
                type: _.type,
                serial: _.serial,
                addressRetrievalCount: _.addressRetrievalCount,
                allCats: _.allCats,
                puzzleHash: _.puzzleHash,
              }
          )
        ),
        state.encryptKey
      );
      state.encryptedAccounts = encryptedAccounts;
      state.encryptedSeed = encryptedSeed;

      const ustore = UniStorage.create();
      await ustore.setItem(
        "SETTINGS",
        JSON.stringify({
          encryptedSeed: encryptedSeed,
          passwordHash: state.passwordHash,
          salt: state.salt,
          encryptedAccounts: encryptedAccounts,
          experiment: state.experiment,
          currency: state.currency,
          selectedAccount: rootState.account.selectedAccount,
        })
      );

      await dispatch("saveState");
    },
    async saveState({ rootState }) {
      const ustore = UniStorage.create();
      if (ustore.type == "background") {
        await ustore.setItem(
          "MEMORY_STATE",
          JSON.stringify({
            account: rootState.account,
            network: rootState.network,
            vault: rootState.vault,
            app: {
              debug: rootState.app.debug,
              selfTestStatus: rootState.app.selfTestStatus == "Passed" ? "Passed" : "Checking",
            },
          })
        );
      }
    },
    async clear() {
      const ustore = UniStorage.create();
      await ustore.removeItem("SETTINGS");
      await ustore.removeItem("MEMORY_STATE");
      await ustore.removeItem("DEBUG_MODE");
      await ustore.removeItem("NETWORK_ID");
      await ustore.removeItem("DISPLAY_DAPP");
      await ustore.removeItem("Locale");
      await ustore.removeItem("CONTACTS");
      await ustore.removeItem("CUSTOM_NETWORKS");
      await ustore.removeItem("DID_NAMES");
    },
  },
});

function ensureState(state: IRootState) {
  for (let i = 0; i < state.account.accounts.length; i++) {
    const account = state.account.accounts[i];
    account.allCats ??= [];
    for (let j = 0; j < account.allCats.length; j++) {
      const cat = account.allCats[j];
      cat.network ??= store.state.network.defaultNetworkId;
      cat.name ??= "CAT";
    }
  }
}

export async function getPasswordHash(password: string): Promise<string> {
  return await utility.strongHash(password, store.state.vault.salt, PasswordHashIteration);
}

export async function getEncryptKey(password: string): Promise<string> {
  return await utility.strongHash(password, store.state.vault.salt, EncryptKeyHashIteration);
}

export async function isPasswordCorrect(password: string): Promise<boolean> {
  // upgrade security level by adding salt and strong hash, here keep backward compatibility.
  const salt = store.state.vault.salt;
  const pswhash: string = salt ? await getPasswordHash(password) : await utility.hash(password);
  return pswhash == store.state.vault.passwordHash;
}
