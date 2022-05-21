import store from '@/store'
import { TokenInfo } from './account';

export interface NetworkDetail {
  name: string;
  rpcUrl: string;
  prefix: string;
  symbol: string;
  chainId: string;
  explorerUrl: string;
  tokenInfo: TokenInfo;
}

export interface NetworkInfo {
  [key: string]: NetworkDetail
}

export interface INetworkState {
  networkId: string;
  network: NetworkDetail;
  networks: NetworkInfo;
  symbol: string;
  prefix: string;
}
const NETWORK_ID_KEY = "NETWORK_ID";

store.registerModule<INetworkState>('network', {
  state() {
    const networks: NetworkInfo = {
      testnet10: {
        name: "testnet10",
        rpcUrl: process.env.VUE_APP_API_URL_TESTNET ?? "",
        prefix: "txch",
        symbol: "TXCH",
        chainId: "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2",
        explorerUrl: "https://chia.tt/",
        tokenInfo: {
          "TXCH": {
            symbol: "TXCH",
            decimal: 12,
            unit: "TXCH",
          },
        },
      },
      mainnet: {
        name: "mainnet",
        rpcUrl: process.env.VUE_APP_API_URL ?? "",
        prefix: "xch",
        symbol: "XCH",
        chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
        explorerUrl: "https://chia.tt/",
        tokenInfo: {
          "XCH": {
            symbol: "XCH",
            decimal: 12,
            unit: "XCH",
          },
          "USDS": {
            symbol: "USDS",
            decimal: 3,
            unit: "USDS",
            id: "6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589",
          },
          "BSH": {
            symbol: "BSH",
            decimal: 3,
            unit: "BSH",
            id: "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b"
          },
        },
      },
    };
    const networkId = localStorage.getItem(NETWORK_ID_KEY) || "mainnet";
    const network = networks[networkId] || networks.mainnet;
    return {
      networkId,
      networks,
      network,
      symbol: network.symbol,
      prefix: network.prefix,
    }
  },
  actions: {
    async switchNetwork({ state, rootState }, networkId: string | null) {
      networkId = networkId || localStorage.getItem(NETWORK_ID_KEY) || "mainnet";
      const network = state.networks[networkId] || state.networks.mainnet;
      state.network = network;
      state.networkId = network.chainId;
      state.symbol = network.symbol;
      state.prefix = network.prefix;
      rootState.account.tokenInfo = network.tokenInfo;
      localStorage.setItem(NETWORK_ID_KEY, state.networkId);
    },
  },
});
