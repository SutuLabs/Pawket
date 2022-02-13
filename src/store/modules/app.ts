import { NotificationProgrammatic as Notification } from "buefy";
import store from '@/store'
import { ModuleInstance } from "@chiamine/bls-signatures";
import * as clvm_tools from "clvm_tools/browser";
import loadBls from "@chiamine/bls-signatures";

export interface IAppState {
  bls?: ModuleInstance;
  clvmInitialized: boolean;
  debug: boolean;
  externalExplorerPrefix: string;
}

store.registerModule<IAppState>('app', {
  state() {
    return {
      clvmInitialized: false,
      externalExplorerPrefix: 'https://chia.tt/info/address/',
      debug: false,
      bls: undefined,
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
          message: `拷贝成功: ${copyText}`,
          type: "is-success",
        });
      } catch (err) {
        Notification.open({
          message: "拷贝成功失败",
          type: "is-danger",
        });
      }

      document.body.removeChild(textArea);
    },
  },
});