import Vue from "vue";
import MixchApp from "./MixchApp.vue";
import "./registerServiceWorker";
import router from "./router/mixch";
import Buefy from "buefy";
import i18n from "./i18n/i18n";
import "@mdi/font/css/materialdesignicons.css";
import sanitizeHTML from "sanitize-html";
import { Instance } from "./services/util/instance";

Vue.config.productionTip = false;
Vue.use(Buefy);

Vue.prototype.$sanitize = sanitizeHTML;

document.title = "Mixch - Pawket Developer";

new Vue({
  router,
  i18n,
  render: (h) => h(MixchApp),
}).$mount("#app");

import "./store/modules/network";
import "./store/modules/app";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

Instance.init();