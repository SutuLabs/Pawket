import store from "@/store";

export interface errorLog {
  msg: string;
  info: string;
  url: string;
  stack: string;
}

export interface IErrorState {
  errorLogs: errorLog[];
}

store.registerModule<IErrorState>("error", {
  state() {
    return {
      errorLogs: [],
    };
  },
  actions: {
    clearErrorLog({ state }) {
      state.errorLogs = [];
    },
    addErrorLog({ state }, errorLog: errorLog) {
      state.errorLogs.push(errorLog);
    },
  },
});
