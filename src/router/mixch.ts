import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    name: "home",
    path: "/home",
    component: () => import(/* webpackChunkName: "home" */ "../components/DevHelper/MixchHome.vue"),
  },
  {
    path: "/tools",
    component: () => import(/* webpackChunkName: "devHelper" */ "../components/DevHelper/DevPanels.vue"),
    children: [
      {
        path: "",
        redirect: "address",
      },
      {
        name: "Address",
        path: "address",
        component: () => import(/* webpackChunkName: "create" */ "../components/DevHelper/HashPanel.vue"),
      },
      {
        name: "Name",
        path: "name",
        component: () => import(/* webpackChunkName: "create" */ "../components/DevHelper/NamePanel.vue"),
      },
      {
        name: "CLVM",
        path: "clvm",
        component: () => import(/* webpackChunkName: "create" */ "../components/DevHelper/ClvmPanel.vue"),
      },
      {
        name: "Bundle",
        path: "bundle",
        component: () => import(/* webpackChunkName: "create" */ "../components/DevHelper/BundlePanel.vue"),
      },
      {
        name: "Offer",
        path: "offer",
        component: () => import(/* webpackChunkName: "create" */ "../components/DevHelper/OfferPanel.vue"),
      },
      {
        name: "Coin",
        path: "coin",
        component: () => import(/* webpackChunkName: "create" */ "../components/DevHelper/CoinPanel.vue"),
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
    path: "/gallery",
    name: "CoinSetGallery",
    component: () => import(/* webpackChunkName: "developer" */ "../views/CoinGallery.vue"),
  },
  {
    path: "*",
    redirect: "/"
  },
];

const router = new VueRouter({
  routes,
});

export default router;
