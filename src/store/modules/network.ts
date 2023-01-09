import store from "@/store";
import { TokenInfo } from "@/models/account";
import puzzle from "@/services/crypto/puzzle";
import Vue from "vue";
import { NetworkContext } from "@/services/coin/coinUtility";
import { getLineageProofPuzzle } from "@/services/transfer/call";

export function xchPrefix(): string {
  return store.state.network.prefix;
}
export function xchSymbol(): string {
  return store.state.network.symbol;
}
export function rpcUrl(): string {
  return store.state.network.network.rpcUrl;
}
export function chainId(): string {
  return store.state.network.network.chainId;
}
export function mainnetChainId(): string {
  return store.state.network.networks['mainnet'].chainId;
}
export function convertToChainId(networkName: string): string {
  if (!networkName || networkName == 'mainnet') return "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
  if (networkName == 'testnet10') return "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2";
  return networkName;
}
export function networkContext(): NetworkContext {
  return {
    symbol: xchSymbol(),
    prefix: xchPrefix(),
    chainId: chainId(),
    api: (_) => getLineageProofPuzzle(_, rpcUrl()),
  }
}
export function ensureAddress(address: string | undefined): string {
  if (!address) return "";
  return puzzle.getAddressFromPuzzleHash(puzzle.getPuzzleHashFromAddress(address), xchPrefix());
}
export function isDefaultNetwork(name: string): boolean {
  return name == "mainnet" || name == "testnet10";
}

export interface NetworkDetail {
  name: string;
  rpcUrl: string;
  prefix: string;
  symbol: string;
  chainId: string;
  explorerUrl: string;
  spaceScanUrl: string;
  tokenInfo: TokenInfo;
}

export interface NetworkInfo {
  [key: string]: NetworkDetail;
}

export interface INetworkState {
  networkId: string;
  network: NetworkDetail;
  networks: NetworkInfo;
  symbol: string;
  prefix: string;
  defaultNetworkId: string;
  peekHeight?: number;
}
const NETWORK_ID_KEY = "NETWORK_ID";
const CUSTOM_NETWORKS = "CUSTOM_NETWORKS";

store.registerModule<INetworkState>("network", {
  state() {
    const networks: NetworkInfo = {
      mainnet: {
        name: "mainnet",
        rpcUrl: process.env.VUE_APP_API_URL ?? "",
        prefix: "xch",
        symbol: "XCH",
        chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
        explorerUrl: "https://www.spacescan.io/xch/address/",
        spaceScanUrl: "https://www.spacescan.io/xch/nft/",
        tokenInfo: {
          XCH: {
            symbol: "XCH",
            decimal: 12,
            unit: "XCH",
          },
        },
      },
      testnet10: {
        name: "testnet10",
        rpcUrl: process.env.VUE_APP_API_URL_TESTNET ?? "",
        prefix: "txch",
        symbol: "TXCH",
        chainId: "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2",
        explorerUrl: "https://www.spacescan.io/txch10/address/",
        spaceScanUrl: "https://www.spacescan.io/txch10/nft/",
        tokenInfo: {
          TXCH: {
            symbol: "TXCH",
            decimal: 12,
            unit: "TXCH",
          },
        },
      },
    };
    const CustomNetworks: NetworkDetail[] = JSON.parse(localStorage.getItem(CUSTOM_NETWORKS) ?? "[]");
    CustomNetworks.forEach(network => {
      if (!isDefaultNetwork(network.name)) networks[network.name] = network;
    })
    const defaultNetworkId = networks.mainnet.name;
    const networkId = localStorage.getItem(NETWORK_ID_KEY) || defaultNetworkId;
    const network = networks[networkId] || networks.mainnet;
    return {
      networkId,
      networks,
      network,
      symbol: network.symbol,
      prefix: network.prefix,
      defaultNetworkId,
    };
  },
  actions: {
    async switchNetwork({ state, rootState }, networkId: string | null) {
      networkId = networkId || localStorage.getItem(NETWORK_ID_KEY) || state.defaultNetworkId;
      const network = state.networks[networkId] || state.networks.mainnet;
      state.networkId = network.name;
      state.network = network;
      state.symbol = network.symbol;
      state.prefix = network.prefix;
      if (rootState.account) {
        rootState.account.tokenInfo = network.tokenInfo;
        for (let i = 0; i < rootState.account.accounts.length; i++) {
          const account = rootState.account.accounts[i];
          account.addressGenerated = 0;
        }
      }
      localStorage.setItem(NETWORK_ID_KEY, state.networkId);
    },
    addOrUpdateNetwork({ state }, network: NetworkDetail) {
      if (isDefaultNetwork(network.name)) return;
      Vue.set(state.networks, network.name, network);
      const CustomNetworks: NetworkDetail[] = JSON.parse(localStorage.getItem(CUSTOM_NETWORKS) ?? "[]");
      const idx = CustomNetworks.findIndex(cn => cn.name == network.name);
      if (idx == -1) CustomNetworks.push(network);
      else CustomNetworks[idx] = network;
      localStorage.setItem(CUSTOM_NETWORKS, JSON.stringify(CustomNetworks));
    },
    async deleteNetwork({ state, dispatch }, name: string) {
      if (!state.networks[name]) return;
      Vue.delete(state.networks, name);
      const CustomNetworks: NetworkDetail[] = JSON.parse(localStorage.getItem(CUSTOM_NETWORKS) ?? "[]");
      const idx = CustomNetworks.findIndex(cn => cn.name == name);
      if (idx > -1) CustomNetworks.splice(idx, 1);
      if (state.networkId == name) await dispatch("switchNetwork", state.defaultNetworkId);
      localStorage.setItem(CUSTOM_NETWORKS, JSON.stringify(CustomNetworks));
    },
  }
});
