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
    return {
      network: 0 || "main",
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
