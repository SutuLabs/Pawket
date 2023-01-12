import store from "@/store";
import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/login",
    name: "Login",
    component: () => import(/* webpackChunkName: "home" */ "@/components/Login/VerifyPassword.vue"),
  },
  {
    path: "/home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
    children: [
      {
        path: "",
        redirect: 'asset'
      },
      {
        path: "asset",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "nft",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Nft/NftPanel.vue"),
      },
      {
        path: "did",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Did/Did.vue"),
      },
      {
        path: "utxos",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Utxo/UtxoPanel.vue"),
      },
      {
        path: "cats",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "accounts",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "send",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "buy",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "scan",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "receive",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "errorLog",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "proxy",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "make-offer",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "batch-send",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "issue-cat",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "mint-nft",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "take-offer",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "scan-assets",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "batch-mint-nft",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "verify-message",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "encrypt-message",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "decrypt-message",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
      {
        path: "split-coin",
        component: () => import(/* webpackChunkName: "home" */ "@/components/Cat/CatPanel.vue"),
      },
    ],
  },
  {
    path: "/create",
    component: () => import(/* webpackChunkName: "create" */ "../views/Create.vue"),
    children: [
      {
        path: "/",
        name: "Create",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Welcome.vue"),
      },
      {
        path: "disclaimer",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Disclaimer.vue"),
      },
      {
        path: "create-password",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/CreatePassword.vue"),
      },
      {
        path: "create-wallet",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/CreateWallet.vue"),
      },
      {
        path: "import",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Import.vue"),
      },
      {
        path: "import-backup",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/ImportBackup.vue"),
      },
      {
        path: "add",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Add.vue"),
      },
    ],
  },
  {
    path: "/cns",
    name: "Cns",
    component: () => import(/* webpackChunkName: "trade" */ "../views/Cns.vue"),
  },
  {
    path: "/explore",
    component: () => import(/* webpackChunkName: "explore" */ "../views/Explore.vue"),
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
        component: () => import(/* webpackChunkName: "explore-market-nfts" */ "../components/Dexie/Market.vue"),
        children: [
          {
            path: "nft",
            component: () => import(/* webpackChunkName: "explore-market-nfts" */ "../components/Dexie/NftMarket.vue"),
          },
          {
            path: "cat",
            component: () => import(/* webpackChunkName: "explore-market-nfts" */ "../components/Dexie/CatMarket.vue"),
          },
        ],
      },
      {
        path: "offers/:type/:offered/:requested/:page",
        component: () => import(/* webpackChunkName: "explore-offer" */ "../components/Dexie/Offer.vue"),
      },
    ],
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import(/* webpackChunkName: "settings" */ "../views/Settings.vue"),
    children: [
      {
        path: "general",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Settings/General.vue"),
      },
      {
        path: "security",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Settings/Security.vue"),
      },
      {
        path: "addressBook",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/AddressBook/AddressBook.vue"),
      },
      {
        path: "network",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Settings/Network.vue"),
      },
      {
        path: "collection",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Collection/Collection.vue"),
      },
      {
        path: "advanced",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Settings/Advanced.vue"),
      },
      {
        path: "devhelper",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/DevHelper/DevHelper.vue"),
      },
      {
        path: "about",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Settings/About.vue"),
      },
    ],
  },
  {
    path: "/connect",
    component: () => import(/* webpackChunkName: "settings" */ "@/components/Connect/Connect.vue"),
    children: [
      {
        path: "take-offer",
        component: () => import(/* webpackChunkName: "settings" */ "@/components/Offer/Take.vue"),
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
