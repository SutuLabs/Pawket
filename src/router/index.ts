import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Create from "../views/Create.vue";
import Welcome from "../components/Create/Welcome.vue";
import Disclaimer from "../components/Create/Disclaimer.vue";
import CreatePassword from "../components/Create/CreatePassword.vue";
import CreateWallet from "../components/Create/CreateWallet.vue";
import Add from "../components/Create/Add.vue";
import Import from "../components/Create/Import.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/create",
    component: Create,
    children: [
      {
        path: "/",
        component: Welcome,
      },
      {
        path: "disclaimer",
        component: Disclaimer,
      },
      {
        path: "create-password",
        component: CreatePassword,
      },
      {
        path: "create-wallet",
        component: CreateWallet,
      },
      {
        path: "import",
        component: Import,
      },
      {
        path: "add",
        component: Add,
      },
    ],
  },
  {
    path: "/clvm",
    name: "Simulator",
    component: () => import(/* webpackChunkName: "simulator" */ "../views/Simulator.vue"),
  },
  {
    path: "/developer",
    name: "CoinDeveloper",
    component: () => import(/* webpackChunkName: "developer" */ "../views/CoinDeveloper.vue"),
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
  },
  {
    path: "/settings",
    component: () => import(/* webpackChunkName: "settings" */ "../views/Settings.vue"),
  },
];

const router = new VueRouter({
  routes,
});

export default router;
