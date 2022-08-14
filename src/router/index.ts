import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
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
