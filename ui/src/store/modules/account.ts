import store from "@/store";
import account, { AccountKey } from "../../../../lib-chia/services/crypto/account";
import Vue from "vue";
import receive, { CoinClassType, DidDetail, NftDetail, TokenPuzzleAddress } from "../../../../lib-chia/services/crypto/receive";
import { convertToChainId, chainId, rpcUrl, xchPrefix, xchSymbol } from "@/store/modules/network";
import { AccountEntity, AccountTokens, AccountType, CustomCat, TokenInfo } from "../../../../lib-chia/models/account";
import {
  DEFAULT_ADDRESS_RETRIEVAL_COUNT,
  getAccountAddressDetails as getAccountAddressDetailsExternal,
  getAccountPuzzleObservers,
} from "../../../../lib-chia/services/util/account";
import { convertToOriginCoin, getCompletedTransactions, unlockCoins } from "../../../../lib-chia/services/coin/coinUtility";
import { OriginCoin } from "../../../../lib-chia/services/spendbundle";
import { prefix0x } from "../../../../lib-chia/services/coin/condition";
import { desktopNotify } from "@/services/notification/notification";
import { tc } from "@/i18n/i18n";
import puzzle from "../../../../lib-chia/services/crypto/puzzle";
import { getScalarString } from "../../../../lib-chia/services/coin/nft";

export function getAccountCats(account: AccountEntity): CustomCat[] {
  const cats = account.allCats?.filter((c) => convertToChainId(c.network) == chainId()) ?? [];
  for (const c of cats) {
    if (c.img == "https://images.taildatabase.com/tails/86b8ebab-7d76-4321-972a-a57b23dbf5b4.jpeg") {
      c.img = "https://storage.pawket.app/ipfs/QmaDrAPVgYxp2TJoqaudjjRy9TqFDmyrTvy3MUEdW6YXt1?filename=USDS.png";
    }
    if (c.img == "https://images.taildatabase.com/tails/cd864a92-facb-48a5-a02e-6344425538c8.png") {
      c.img = "https://storage.pawket.app/ipfs/QmRU7jq8TKWgNW4Yc9FkHdzyofNfV8PbjJhw5B9xhd1DVK?filename=BSH.png";
    }
  }
  return cats;
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

function setDidName(dids: DidDetail[]): void {
  let currentNames: DidName[] = [];
  let names: DidName[] = [];
  try {
    names = JSON.parse(localStorage.getItem("DID_NAMES") ?? "[]") as DidName[];
    currentNames = names.filter((n) => dids.findIndex((d) => d.did == n.did) > -1);
  } catch (error) {
    currentNames = [];
  }
  for (let i = 0; i < dids.length; i++) {
    const idx = currentNames.findIndex((n) => n.did == dids[i].did);
    if (idx > -1) {
      dids[i].name = currentNames[idx].name;
    } else {
      let idx = 1;
      while (currentNames.findIndex((n) => n.name == `DID${idx}`) > -1) {
        idx++;
      }
      dids[i].name = `DID${idx}`;
      currentNames.push({ name: `DID${idx}`, did: dids[i].did });
    }
  }
  // merge current names with all names
  for (const name of names) {
    const idx = currentNames.findIndex((n) => n.did == name.did);
    if (idx > -1) {
      name.name = currentNames[idx].name;
      currentNames.splice(idx, 1);
    }
  }
  names.push(...currentNames);
  localStorage.setItem("DID_NAMES", JSON.stringify(names));
}

export interface DidName {
  name: string;
  did: string;
}

export interface IAccountState {
  selectedAccount: number;
  accounts: AccountEntity[];
  tokenInfo: TokenInfo;
  refreshing: boolean;
}

store.registerModule<IAccountState>("account", {
  state() {
    return {
      tokenInfo: {},
      accounts: [],
      selectedAccount: 0,
      refreshing: false,
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
    async createAccountByPublicKey({ state, dispatch }, { name, publicKey }: { name: string; publicKey: string }) {
      state.accounts.push(
        getAccountEntity(
          {
            compatibleMnemonic: "",
            fingerprint: account.getFingerprint(publicKey),
            privateKey: "",
            publicKey: prefix0x(publicKey),
          },
          name,
          "PublicKey",
          undefined,
          undefined
        )
      );
      await dispatch("initWalletAddress");
      await dispatch("persistent");
    },
    setProfilePic({ state, dispatch }, { idx, profilePic }: { idx: number; profilePic: string }) {
      state.accounts.splice(idx, 1, Object.assign({}, state.accounts[idx], { profilePic }));
      dispatch("persistent");
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
    async refreshBalance({ state, rootState }, parameters: { idx: number; maxId: number }) {
      if (state.refreshing) return;
      state.refreshing = true;
      const to = setTimeout(function () {
        state.refreshing = false;
      }, 30000);
      function resetState() {
        clearTimeout(to);
        state.refreshing = false;
      }
      try {
        if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1 };
        let idx = parameters.idx;
        if (typeof idx !== "number" || idx <= 0) idx = state.selectedAccount;
        const account = state.accounts[idx];
        if (!account) {
          resetState();
          return;
        }

        const requests = await getAccountAddressDetails(account, parameters.maxId);
        // init account tokens
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
        try {
          const records = await receive.getCoinRecords(requests, true, rpcUrl());
          rootState.vault.disconnected = false;
          rootState.network.peekHeight = records.peekHeight;
          const activities = receive.convertActivities(requests, records);
          const tokenBalances = receive.getTokenBalance(requests, records);
          const coins = activities.map((act) => {
            if (act.spent && act.coin) return convertToOriginCoin(act.coin);
          });
          const uc = unlockCoins(coins as OriginCoin[]);
          const blockHeights = getCompletedTransactions(uc, activities);
          blockHeights
            .filter((_, i) => blockHeights.indexOf(_) === i) // filter duplicated items
            .forEach((block) => {
              const title = tc("app.message.notification.transactionComplete.title");
              const body = tc("app.message.notification.transactionComplete.body", undefined, { block });
              desktopNotify(title, body);
            });
          Vue.set(account, "activities", activities);
          Vue.set(account, "tokens", tokenBalances);
        } catch (error) {
          if (String(error).match(/Failed to fetch/)) rootState.vault.disconnected = true;
          console.warn("error get account balance", error);
        }
      } catch (error) {
        console.warn("error refresh account balance", error);
      } finally {
        resetState();
      }
    },
    async refreshNfts({ dispatch }, parameters: { idx: number; maxId: number }) {
      await dispatch("refreshAssets", Object.assign({ coinType: "NftV1" }, parameters));
    },
    async refreshDids({ dispatch }, parameters: { idx: number; maxId: number }) {
      await dispatch("refreshAssets", Object.assign({ coinType: "DidV1" }, parameters));
    },
    async refreshAssets({ state }, parameters: { idx: number; maxId: number; coinType: CoinClassType }) {
      if (!parameters) parameters = { idx: state.selectedAccount, maxId: -1, coinType: "DidV1" };
      let idx = parameters.idx;
      if (typeof idx !== "number" || idx <= 0) idx = state.selectedAccount;
      const account = state.accounts[idx];
      if (!account) return;

      const requests = await getAccountAddressDetails(account, parameters.maxId);
      const assetRecords = await receive.getCoinRecords(requests, false, rpcUrl(), false, parameters.coinType, true);

      // replace hintPuzzle of analysis
      assetRecords.coins.forEach((coin) =>
        coin.records.forEach((rec) => {
          if (rec.analysis && rec.coin) {
            rec.analysis.hintPuzzle = prefix0x(coin.puzzleHash);
            rec.analysis.coin = convertToOriginCoin(rec.coin);
          }
        })
      );

      if (parameters.coinType == "DidV1") {
        const didRecords = assetRecords.coins.flatMap((coin) => coin.records);
        for (const record of didRecords) {
          if (record.analysis && record.coin && "didInnerPuzzleHash" in record.analysis) {
            const did: DidDetail = {
              name: puzzle.getAddressFromPuzzleHash(record.analysis.launcherId, "did:chia:"),
              did: puzzle.getAddressFromPuzzleHash(record.analysis.launcherId, "did:chia:"),
              hintPuzzle: record.analysis.hintPuzzle,
              coin: convertToOriginCoin(record.coin),
              analysis: record.analysis,
            };
            if (!account.dids) Vue.set(account, "dids", []);
            if (account.dids && account.dids.findIndex((d) => d.did == did?.did) == -1) {
              account.dids.push(did);
            }
          }
        }
        if (account.dids) setDidName(account.dids);
        Vue.set(account, "dids", account.dids);
      } else {
        const nftRecords = assetRecords.coins.flatMap((coin) => coin.records);
        if (nftRecords.length && nftRecords[0].analysis) {
          for (const record of nftRecords) {
            if (record.analysis && record.coin && "didOwner" in record.analysis) {
              const nft: NftDetail = {
                metadata: {
                  uri: getScalarString(record.analysis.metadata.imageUri) ?? "",
                  hash: getScalarString(record.analysis.metadata.imageHash) ?? "",
                },
                hintPuzzle: record.analysis.hintPuzzle,
                address: puzzle.getAddressFromPuzzleHash(record.analysis.launcherId, "nft"),
                coin: convertToOriginCoin(record.coin),
                analysis: record.analysis,
              };
              if (!account.nfts) Vue.set(account, "nfts", []);
              if (account.nfts && account.nfts.findIndex((d) => d.address == nft?.address) == -1) {
                account.nfts.push(nft);
              }
            }
          }
          Vue.set(account, "nfts", account.nfts);
        }
      }
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
    allCats: [
      // {
      //   name: "USDS",
      //   id: "6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589",
      //   img: "https://images.taildatabase.com/tails/86b8ebab-7d76-4321-972a-a57b23dbf5b4.jpeg",
      //   network: "mainnet",
      // },
      // {
      //   name: "BDOG",
      //   id: "efd85235c35cda41c7d58fe0ffed4c54048540d130fe8e6cd645ec5b2aebb9f8",
      //   img: "https://storage.pawket.app/ipfs/QmeSDcMhnuRsaWotXYoRVJHwHQvQhMhXM9Vm4qrfPpHQUn?filename=BDOG.png",
      //   network: "mainnet",
      // },
      {
        name: "BSH",
        id: "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b",
        img: "https://storage.pawket.app/ipfs/QmRU7jq8TKWgNW4Yc9FkHdzyofNfV8PbjJhw5B9xhd1DVK?filename=BSH.png",
        network: "mainnet",
      },
    ],
    nfts: [],
    dids: [],
    extraInfo: {},
    addressGenerated: 0,
    addressPuzzles: [],
  };
}

export async function getAccountAddressDetails(
  account: AccountEntity,
  maxId: number | undefined = undefined
): Promise<TokenPuzzleAddress[]> {
  const requests: TokenPuzzleAddress[] =
    account.type == "Address"
      ? <TokenPuzzleAddress[]>[
          { symbol: xchSymbol(), puzzles: [{ hash: account.puzzleHash, type: "Unknown", address: account.firstAddress }] },
        ]
      : account.type == "PublicKey"
      ? await getAccountPuzzleObservers(
          account,
          getAccountCats(account),
          store.state.account.tokenInfo,
          xchPrefix(),
          xchSymbol(),
          maxId,
          "cat_v2"
        )
      : await getAccountAddressDetailsExternal(
          account,
          getAccountCats(account),
          store.state.account.tokenInfo,
          xchPrefix(),
          xchSymbol(),
          maxId,
          "cat_v2"
        );

  return requests;
}
