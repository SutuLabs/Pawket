<template>
  <div id="app" ref="container" class="container">
    <div class="nav-box">
      <div>
        <b-navbar>
          <template #brand>
            <b-navbar-item tag="router-link" to="/">
              <img src="@/assets/mixch.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
            </b-navbar-item>
          </template>
          <template #start> </template>
          <template #end>
            <b-navbar-dropdown :label="networkId">
              <b-navbar-item
                @click="switchNetwork(net.name)"
                v-for="net in networks"
                :key="net.name"
                :active="networkId === net.name"
              >
                {{ net.name }}
              </b-navbar-item>
            </b-navbar-dropdown>
            <div class="py-4">
              <router-link to="/tools" v-bind="$props" custom v-slot="{ isActive, href, navigate }">
                <b-button
                  v-bind="$attrs"
                  @click="navigate"
                  icon-left="toolbox"
                  type="is-primary"
                  outlined
                  :class="isActive ? 'border-less has-background-primary has-text-white' : 'border-less '"
                >
                  Tools
                </b-button>
              </router-link>
              <router-link to="/gallery" v-bind="$props" custom v-slot="{ isActive, href, navigate }">
                <b-button
                  v-bind="$attrs"
                  @click="navigate"
                  icon-left="source-repository-multiple"
                  type="is-primary"
                  outlined
                  :class="isActive ? 'border-less has-background-primary has-text-white' : 'border-less '"
                >
                  Gallery
                </b-button>
              </router-link>
              <router-link to="/clvm" v-bind="$props" custom v-slot="{ isActive, href, navigate }">
                <b-button
                  v-bind="$attrs"
                  @click="navigate"
                  icon-left="coffee-maker"
                  type="is-primary"
                  outlined
                  :class="isActive ? 'border-less has-background-primary has-text-white' : 'border-less '"
                >
                  Simulator
                </b-button>
              </router-link>
              <router-link to="/developer" v-bind="$props" custom v-slot="{ isActive, href, navigate }">
                <b-button
                  v-bind="$attrs"
                  @click="navigate"
                  icon-left="code-parentheses-box"
                  type="is-primary"
                  outlined
                  :class="isActive ? 'border-less has-background-primary has-text-white' : 'border-less '"
                >
                  Studio
                </b-button>
              </router-link>
            </div>
          </template>
        </b-navbar>
      </div>
    </div>
    <div class="content-wrapper">
      <keep-alive>
        <router-view :key="$route.fullPath"></router-view>
      </keep-alive>
    </div>
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong>Mixch</strong>
          <span>[{{ version }}]</span> by <b-icon icon="github" size="is-small"></b-icon>
          <a :href="$t('footer.ui.productInfo.authorLink')" target="_blank" class="has-color-link">
            {{ $t("footer.ui.productInfo.author") }}
            <b-icon icon="open-in-new" size="is-small"></b-icon>
          </a>
          <br />
          <router-link :to="{ name: 'home' }">
            <b-icon icon="home" size="is-small"></b-icon>
            {{ $t("footer.ui.button.home") }}
          </router-link>
          |
          <a href="https://pawket.app/" target="_blank" size="is-small" class="has-color-link">
            <b-icon icon="paw" size="is-small"></b-icon>
            Pawket
            <b-icon icon="open-in-new" size="is-small"></b-icon>
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "./store";
import { NetworkInfo } from "./store/modules/network";
import VerifyPassword from "@/components/Login/VerifyPassword.vue";
import MobileNav from "./components/Navigation/MobileNav.vue";
import NavBar from "./components/Navigation/Navbar.vue";
import { tc } from "./i18n/i18n";

@Component({ components: { VerifyPassword, MobileNav, NavBar } })
export default class MixchApp extends Vue {
  @Watch("path")
  scrollTop(): void {
    const container = this.$refs.container as Element;
    if (container) container.scrollIntoView();
  }

  get version(): string {
    return process.env.VUE_APP_VERSION || tc("footer.ui.error.READ_VERSION_FAILED");
  }

  mounted(): void {
    //
  }

  async switchNetwork(networkId: string): Promise<void> {
    await store.dispatch("switchNetwork", networkId);
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.dispatch("switchNetwork", value);
  }
}
</script>
<style lang="scss">
@import "@/styles/colors.scss";

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.content-wrapper {
  flex: 1;
}
</style>
