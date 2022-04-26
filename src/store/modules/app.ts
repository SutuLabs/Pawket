import { NotificationProgrammatic as Notification } from "buefy";
import store from '@/store'
import { ModuleInstance } from "@chiamine/bls-signatures";
import * as clvm_tools from "clvm_tools/browser";
import loadBls from "@chiamine/bls-signatures";
import TestRunner from "@/services/selftest/runner";
import { tc } from "../../i18n/i18n";

export type SelfTestStatus = "Checking" | "Passed" | "Failed";
export interface IAppState {
  bls?: ModuleInstance;
  clvmInitialized: boolean;
  debug: boolean;
  externalExplorerPrefix: string;
  selfTestStatus: SelfTestStatus;
  selfTestError: string;
}

store.registerModule<IAppState>('app', {
  state() {
    return {
      clvmInitialized: false,
      externalExplorerPrefix: 'https://chia.tt/info/address/',
      debug: false,
      bls: undefined,
      selfTestStatus: "Checking",
      selfTestError: "",
    };
  },
  actions: {

    async initializeClvm({ state }) {
      if (state.clvmInitialized) return;
      await clvm_tools.initialize();
      state.clvmInitialized = true;
    },

    async initializeBls({ state }) {
      if (state.bls) return;
      const BLS = await loadBls();
      state.bls = BLS;
    },

    async selfTest({ state, dispatch }) {
      await dispatch("initializeBls");

      if (state.selfTestStatus == "Checking") {
        await TestRunner.selfTest();
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    copy({ state }, copyText: string) {
      const textArea = document.createElement("textarea");
      textArea.value = copyText;

      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        Notification.open({
          message: tc('app.message.notification.copySuccess'),
          type: "is-primary",
        });
      } catch (err) {
        Notification.open({
          message: tc('app.message.notification.copyFailed'),
          type: "is-danger",
        });
      }

      document.body.removeChild(textArea);
    },
  },
});
