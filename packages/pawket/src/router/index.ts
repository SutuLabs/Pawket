import store from "@/store";
import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/components/Login/VerifyPassword.vue"),
  },
  {
    path: "/home",
    component: () => import("../views/Home.vue"),
    children: [
      {
        path: "",
        redirect: 'asset'
      },
      {
        path: "asset",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "nft",
        component: () => import("@/components/Nft/NftPanel.vue"),
      },
      {
        path: "nft/:address",
      },
      {
        path: "did",
        component: () => import("@/components/Did/Did.vue"),
      },
      {
        path: "utxos",
        component: () => import("@/components/Utxo/UtxoPanel.vue"),
      },
      {
        path: "cats",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "accounts",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "send",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "buy",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "swap",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "scan",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "receive",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "errorLog",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "proxy",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "make-offer",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "batch-send",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "issue-cat",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "mint-nft",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "take-offer",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "scan-assets",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "batch-mint-nft",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "verify-message",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "encrypt-message",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "decrypt-message",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
      {
        path: "split-coin",
        component: () => import("@/components/Cat/CatPanel.vue"),
      },
    ],
  },
  {
    path: "/create",
    component: () => import("../views/Create.vue"),
    children: [
      {
        path: "/",
        name: "Create",
        component: () => import("../components/Create/Welcome.vue"),
      },
      {
        path: "disclaimer",
        component: () => import("../components/Create/Disclaimer.vue"),
      },
      {
        path: "create-password",
        component: () => import("../components/Create/CreatePassword.vue"),
      },
      {
        path: "create-wallet",
        component: () => import("../components/Create/CreateWallet.vue"),
      },
      {
        path: "import",
        component: () => import("../components/Create/Import.vue"),
      },
      {
        path: "import-backup",
        component: () => import("../components/Create/ImportBackup.vue"),
      },
      {
        path: "add",
        component: () => import("../components/Create/Add.vue"),
      },
    ],
  },
  {
    path: "/cns",
    name: "Cns",
    component: () => import("../views/Cns.vue"),
  },
  {
    path: "/explore",
    component: () => import("../views/Explore.vue"),
    children: [
      {
        path: "/",
        name: "Explore",
        redirect: () => {
          return { path: "/explore/market/nft" };
        },
      },
      {
        path: "market",
        component: () => import("../components/Dexie/Market.vue"),
        children: [
          {
            path: "nft",
            component: () => import("../components/Dexie/NftMarket.vue"),
          },
          {
            path: "cat",
            component: () => import("../components/Dexie/CatMarket.vue"),
          },
        ],
      },
      {
        path: "offers/:type/:offered/:requested/:page",
        component: () => import("../components/Dexie/Offer.vue"),
      },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
    children: [
      {
        path: "general",
        component: () => import("@/components/Settings/General.vue"),
      },
      {
        path: "security",
        component: () => import("@/components/Settings/Security.vue"),
      },
      {
        path: "addressBook",
        component: () => import("@/components/AddressBook/AddressBook.vue"),
      },
      {
        path: "network",
        component: () => import("@/components/Settings/Network.vue"),
      },
      {
        path: "collection",
        component: () => import("@/components/Collection/Collection.vue"),
      },
      {
        path: "advanced",
        component: () => import("@/components/Settings/Advanced.vue"),
      },
      {
        path: "devhelper",
        component: () => import("@/components/DevHelper/DevHelper.vue"),
      },
      {
        path: "about",
        component: () => import("@/components/Settings/About.vue"),
      },
    ],
  },
  {
    path: "/connect",
    component: () => import("@/components/Connect/Connect.vue"),
    children: [
      {
        path: "take-offer",
        component: () => import("@/components/Offer/Take.vue"),
      },
    ]
  },
  {
    path: "/",
    redirect: () => {
      return { path: "/home" };
    },
  },
];

const router = new VueRouter({
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.path == from.path) return;
  if (to.path.startsWith("/create") || to.name == "Login" || to.path.startsWith("/connect") || store.state.vault.unlocked) next();
  else if (localStorage.getItem("SETTINGS") == null) next({ name: "Create" });
  else next({ name: "Login" });
});
export default router;
