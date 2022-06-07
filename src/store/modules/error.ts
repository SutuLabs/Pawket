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
    const errorLogs = [
      {
        msg: "Cannot read properties of undefined (reading 'a')",
        info: "vue-component-116-ErrorTestA error in render",
        url: "http://localhost:8080/#/",
        stack:
          "TypeError: Cannot read properties of undefined (reading 'a') at a.s (https://panjiachen.github.io/vue-element-admin/static/js/chunk-1147343e.145f0ee1.js:1:946) at t._render (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:23733) at a.r (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:27824) at nr.get (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:30684) at new nr (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:30602) at Ln (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:27838) at Er.$mount (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:65653) at init (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:20547) at h (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:44201) at d (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:43830)",
      },
      {
        msg: "Cannot read properties of undefined (reading 'a')",
        info: "vue-component-116-ErrorTestA error in render",
        url: "http://localhost:8080/#/",
        stack:
          "TypeError: Cannot read properties of undefined (reading 'a') at a.s (https://panjiachen.github.io/vue-element-admin/static/js/chunk-1147343e.145f0ee1.js:1:946) at t._render (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:23733) at a.r (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:27824) at nr.get (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:30684) at new nr (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:30602) at Ln (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:27838) at Er.$mount (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:65653) at init (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:20547) at h (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:44201) at d (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:43830)",
      },
      {
        msg: "Cannot read properties of undefined (reading 'a')",
        info: "vue-component-116-ErrorTestA error in render",
        url: "http://localhost:8080/#/",
        stack:
          "TypeError: Cannot read properties of undefined (reading 'a') at a.s (https://panjiachen.github.io/vue-element-admin/static/js/chunk-1147343e.145f0ee1.js:1:946) at t._render (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:23733) at a.r (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:27824) at nr.get (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:30684) at new nr (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:30602) at Ln (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:27838) at Er.$mount (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:65653) at init (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:20547) at h (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:44201) at d (https://panjiachen.github.io/vue-element-admin/static/js/chunk-libs.cdf84b41.js:18:43830)",
      },
    ];
    return {
      errorLogs: errorLogs,
    };
  },
  actions: {
    clearErrorMsg({ state }) {
      state.errorLogs = [];
    },
    addErrorMsg({ state }, error: Error) {
      if (error) {
        const msg = error.message;
        state.errorLogs.push({ msg: msg, info: msg, url: msg, stack: msg });
      }
    },
  },
});
