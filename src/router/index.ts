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
    name: "Home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
    children: [
      {
        path: "cats",
      },
      {
        path: "accounts",
      },
      {
        path: "send",
      },
      {
        path: "receive",
      },
      {
        path: "errorLog",
      },
      {
        path: "proxy",
      },
      {
        path: "make-offer",
      },
      {
        path: "batch-send",
      },
      {
        path: "issue-cat",
      },
      {
        path: "mint-nft",
      },
      {
        path: "take-offer",
      },
    ],
  },
  {
    path: "/create",
    name: "Create",
    component: () => import(/* webpackChunkName: "create" */ "../views/Create.vue"),
    children: [
      {
        path: "/",
        name: "Create",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Welcome.vue"),
      },
      {
        path: "disclaimer",
        name: "Create",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Disclaimer.vue"),
      },
      {
        path: "create-password",
        name: "Create",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/CreatePassword.vue"),
      },
      {
        path: "create-wallet",
        name: "Create",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/CreateWallet.vue"),
      },
      {
        path: "import",
        name: "Create",
        component: () => import(/* webpackChunkName: "create" */ "../components/Create/Import.vue"),
      },
      {
        path: "add",
        name: "Create",
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
    name: "Explore",
    component: () => import(/* webpackChunkName: "explore" */ "../views/Explore.vue"),
    children: [
      {
        path: "/",
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
      }
    ],
  },
  {
    path: "/",
    redirect: () => {
      return { path: "/create" };
    },
  },
];

const router = new VueRouter({
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.path == from.path) return;
  if (to.name == "Create" || to.name == "Login" || store.state.vault.unlocked) next();
  else if (localStorage.getItem("SETTINGS") == null) next({ name: "Create" });
  else next({ name: "Login" });
});
export default router;
