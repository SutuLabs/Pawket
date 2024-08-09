<template>
  <div class="column nav-box">
    <div class="box is-hidden-mobile">
      <p class="has-text-left is-size-5 pb-2 pl-2 border-bottom">{{ $t("settings.menu.title") }}</p>
      <div class="b-tabs is-vertical">
        <nav role="tablist" aria-orientation="vertical" class="tabs is-boxed">
          <ul>
            <li role="presentation" :class="{ 'is-active': path == '/settings/general' }">
              <router-link role="tab" :to="{ path: '/settings/general' }"
                ><b-icon icon="tune"></b-icon>{{ $t("settings.menu.items.general.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/security' }">
              <router-link role="tab" :to="{ path: '/settings/security' }"
                ><b-icon icon="key"></b-icon>{{ $t("settings.menu.items.security.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/addressBook' }">
              <router-link role="tab" :to="{ path: '/settings/addressBook' }"
                ><b-icon icon="account-box-multiple-outline"></b-icon
                >{{ $t("settings.menu.items.addressBook.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/network' }" v-if="experimentMode">
              <router-link role="tab" :to="{ path: '/settings/network' }"
                ><b-icon icon="access-point-network"></b-icon>{{ $t("settings.menu.items.network.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/collection' }" v-if="debugMode">
              <router-link role="tab" :to="{ path: '/settings/collection' }"
                ><b-icon icon="account-box-multiple-outline"></b-icon
                >{{ $t("settings.menu.items.collection.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/advanced' }">
              <router-link role="tab" :to="{ path: '/settings/advanced' }"
                ><b-icon icon="lightbulb-outline"></b-icon>{{ $t("settings.menu.items.advanced.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/devhelper' }">
              <router-link role="tab" :to="{ path: '/settings/devhelper' }"
                ><b-icon icon="developer-board"></b-icon>{{ $t("settings.menu.items.devhelper.title") }}</router-link
              >
            </li>
            <li role="presentation" :class="{ 'is-active': path == '/settings/about' }">
              <router-link role="tab" :to="{ path: '/settings/about' }"
                ><b-icon icon="information-outline"></b-icon>{{ $t("settings.menu.items.about.title") }}</router-link
              >
            </li>
          </ul>
        </nav>
        <section style="width: 70%">
          <router-view class="width-auto"></router-view>
        </section>
      </div>
    </div>
    <router-view class="is-hidden-tablet"></router-view>
    <div class="is-hidden-tablet pb-4 pt-8" v-if="path == '/settings'">
      <p class="has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top top-bar">{{ $t("settings.menu.title") }}</p>
      <router-link role="tab" :to="{ path: '/settings/general' }" class="panel-block py-0 my-0">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="tune"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.general.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.general.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/security' }" class="panel-block py-0 my-0">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="key"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.security.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.security.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/addressBook' }" class="panel-block py-0 my-0">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="account-box-multiple-outline"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.addressBook.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.addressBook.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/network' }" class="panel-block py-0 my-0" v-if="experimentMode">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="access-point-network"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.network.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.network.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/collection' }" class="panel-block py-0 my-0" v-if="debugMode">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="account-box-multiple-outline"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.collection.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.collection.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/advanced' }" class="panel-block py-0 my-0">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="lightbulb-outline"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.advanced.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.advanced.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/devhelper' }" class="panel-block py-0 my-0">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="developer-board"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.devhelper.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.devhelper.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <router-link role="tab" :to="{ path: '/settings/about' }" class="panel-block py-0 my-0 border-bottom">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="information-outline"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.about.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.about.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </router-link>
      <div class="panel-block my-4">
        <b-button type="is-info" expanded outlined @click="lock()">{{ $t("settings.menu.items.lock") }}</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Lock from "@/components/Settings/Lock.vue";
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component({})
export default class Settings extends Vue {
  lock(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Lock,
      hasModalCard: true,
      canCancel: ["outside"],
      events: { lock: () => store.dispatch("lock") },
      trapFocus: true,
    });
  }

  get path(): string {
    return this.$route.path;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get isMobile(): boolean {
    return isMobile();
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/mixins.sass";
@import "@/styles/topbar.scss";

.width-auto {
  width: 100%;
}

.nav-box {
  max-width: 1000px;
  margin: auto;
}
</style>
