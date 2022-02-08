import Vue from "vue";
import Vuex from "vuex";
import { IAppState } from "./modules/app";
import { IAccountState } from "./modules/account";
import { IVaultState } from "./modules/vault";
import { INetworkState } from "./modules/network";

Vue.use(Vuex);
export interface IRootState {
  app: IAppState
  account: IAccountState
  vault: IVaultState
  network: INetworkState
}

export default new Vuex.Store<IRootState>({})

