import Vue from "vue";
import Vuex from "vuex";
import { IAppState } from "./modules/app";
import { INetworkState } from "./modules/network";

Vue.use(Vuex);
export interface IRootState {
  app: IAppState
  network: INetworkState
}

export default new Vuex.Store<IRootState>({})

