import store from '@/store'

export interface NetworkDetail {
  name: string;
  rpc: string;
  prefix: string;
}

export interface NetworkInfo {
  [key: string]: NetworkDetail
}

export interface INetworkState {
  network: string;
  networks: NetworkInfo;
}

store.registerModule<INetworkState>('network', {
  state() {
    const sts = JSON.parse(localStorage.getItem("SETTINGS") || "{}");

    return {
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
    }
  },
  actions: {
  },
});
