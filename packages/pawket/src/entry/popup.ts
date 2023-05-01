import Vue from "vue";
import router from "@/router";
import store from "@/store";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
import i18n, { tc } from "@/i18n/i18n";
import "@mdi/font/css/materialdesignicons.css";
import App from '../views/popup.vue'

Vue.config.productionTip = false;
Vue.use(Buefy);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Vue as any).$storeType = 'background';

document.title = tc("html.document.title");

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
}).$mount("#app");

import "@/store/modules/app";
import "@/store/modules/account";
import "@/store/modules/vault";
import "@/store/modules/network";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

store.dispatch("initState");
