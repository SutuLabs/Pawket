import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Trade from "../views/Trade.vue";
import Explore from "../views/Explore.vue";
import Settings from "../views/Settings.vue";
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
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
  {
    path: "/clvm",
    name: "Simulator",
    component: () => import(/* webpackChunkName: "simulator" */ "../views/Simulator.vue"),
  },
  {
    path: "/trade",
    name: "Trade",
    component: Trade,
  },
  {
    path: "/explore",
    name: "Explore",
    component: Explore,
  },
  {
    path: "/settings",
    component: Settings,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
