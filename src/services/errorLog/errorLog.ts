import Vue from "vue";
import store from "@/store";
import { errorLog } from "@/store/modules/error";

Vue.config.errorHandler = function (err: Error, vm: Vue, info: string): void {
  Vue.nextTick(() => {
    const errLog: errorLog = {
      msg: err.message,
      info: info,
      url: window.location.href,
      stack: err.stack ?? "",
    };
    store.dispatch("addErrorLog", errLog);
  });
};
