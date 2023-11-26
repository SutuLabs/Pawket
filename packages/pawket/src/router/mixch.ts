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
    component: () => import("../components/DevHelper/MixchHome.vue"),
  },
  {
    path: "/tools",
    component: () => import("../components/DevHelper/DevPanels.vue"),
    children: [
      {
        path: "",
        redirect: "address",
      },
      {
        name: "Address",
        path: "address",
        component: () => import("../components/DevHelper/HashPanel.vue"),
      },
      {
        name: "Name",
        path: "name",
        component: () => import("../components/DevHelper/NamePanel.vue"),
      },
      {
        name: "CLVM",
        path: "clvm",
        component: () => import("../components/DevHelper/ClvmPanel.vue"),
      },
      {
        name: "Bundle",
        path: "bundle",
        component: () => import("../components/DevHelper/BundlePanel.vue"),
      },
      {
        name: "Offer",
        path: "offer",
        component: () => import("../components/DevHelper/OfferPanel.vue"),
      },
      {
        name: "Coin",
        path: "coin",
        component: () => import("../components/DevHelper/CoinPanel.vue"),
      },
    ],
  },
  {
    path: "/clvm",
    name: "Simulator",
    component: () => import("../views/Simulator.vue"),
  },
  {
    path: "/developer",
    name: "CoinDeveloper",
    component: () => import("../views/CoinDeveloper.vue"),
  },
  {
    path: "/gallery",
    name: "CoinSetGallery",
    component: () => import("../views/CoinGallery.vue"),
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
