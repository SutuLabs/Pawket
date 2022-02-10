import store from '@/store'
import utility from "@/services/crypto/utility";
import account, { AccountKey } from "@/services/crypto/account";
import { CoinItem, CoinRecord, GetRecordsResponse } from "@/models/wallet";
import Vue from 'vue';
import puzzle from '@/services/crypto/puzzle';
import receive from '@/services/crypto/receive';

type AccountType = "Serial" | "Password" | "Legacy";

export interface AccountTokenAddress {
  address: string;
  coin?: CoinItem;
}

export interface AccountToken {
  amount: number;
  addresses: AccountTokenAddress[];
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
const DEFAULT_ADDRESS_RETRIEVAL_COUNT = 4;

export interface TokenInfo {
  [symbol: string]: {
    id?: string,
    symbol: string,
    decimal: number,
    unit: string,
  }
};

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
  accounts: Account[];
  tokenInfo: TokenInfo;
  refreshing: boolean;
}

store.registerModule<IAccountState>('account', {
  state() {
    return {
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
      accounts: [],
      selectedAccount: 0,
      refreshing: false,
    }
  },
  actions: {

    createAccountByPassword(
      { state, dispatch, rootState },
      { password, name }: { password: string; name: string }
    ) {
      account.getAccount(rootState.vault.seedMnemonic, password).then((account) => {
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
    async createAccountBySerial({ state, dispatch, rootState }, name: string) {
      const serial = Math.max(...state.accounts.map((_) => (_.serial ? _.serial : 0)), 0) + 1;
      const acc = await account.getAccount(rootState.vault.seedMnemonic, serial.toFixed(0));
      state.accounts.push({
        key: acc,
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
      const acc = await account.getAccount("", null, legacyMnemonic);
      state.accounts.push({
        key: acc,
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

      const requests = await receive.getAssetsRequestDetail(account.key.privateKey, maxId, account.cats ?? []);

      try {
        const activities = await receive.getCoinRecords(requests, true);

        const balances = requests.map(token => ({
          symbol: token.symbol,
          records: activities.filter(act => act.symbol == token.symbol),
          amount: activities
            .filter(act => act.symbol == token.symbol)
            .reduce((recacc, rec) => recacc + ((!rec.coin || rec.spent) ? 0 : rec.coin.amount), 0),

        }))
        const tokenBalances: AccountTokens = {};
        for (let i = 0; i < balances.length; i++) {
          const b = balances[i];
          tokenBalances[b.symbol] = {
            amount: b.amount,
            addresses: b.records.map(_ => ({ address: puzzle.getAddressFromPuzzleHash(_.coin?.puzzleHash ?? "", "xch"), coin: _.coin })),
          };
        }

        Vue.set(account, "activities", activities);
        Vue.set(account, "tokens", tokenBalances);
      }
      catch (error) {
        console.warn("error get account balance", error);
        const tokenBalances: AccountTokens = {};
        for (let i = 0; i < requests.length; i++) {
          const token = requests[i];
          tokenBalances[token.symbol] = {
            amount: -1,
            addresses: (await puzzle.getAddressesFromPuzzleHash(token.puzzles.map(_ => _.hash), "xch")).map(_ => ({ address: _ })),
          }
        }
        Vue.set(account, "tokens", tokenBalances);
      }

      resetState();
    }
  }
});
