import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
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
        path: "nfts",
      },
      {
        path: "utxos",
      },
    ],
  },
  {
    path: "/create",
    component: () => import(/* webpackChunkName: "create" */ "../views/Create.vue"),
    children: [
      {
        path: "/",
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
    name: "Explore",
    component: () => import(/* webpackChunkName: "explore" */ "../views/Explore.vue"),
    children: [
      {
        path: "/",
        component: () => import(/* webpackChunkName: "explore" */ "../components/Dexie/Market.vue"),
      },
      {
        path: "market/:type",
        component: () => import(/* webpackChunkName: "explore-market-nfts" */ "../components/Dexie/Market.vue"),
      },
      {
        path: "offers/:type/:offered/:requested/:page",
        component: () => import(/* webpackChunkName: "explore-offer" */ "../components/Dexie/Offer.vue"),
      },
    ],
  },
  {
    path: "/settings",
    component: () => import(/* webpackChunkName: "settings" */ "../views/Settings.vue"),
  },
  {
    path: "*",
    redirect: "/",
  },
];

const router = new VueRouter({
  routes,
});

export default router;
