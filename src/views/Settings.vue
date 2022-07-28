<template>
  <div class="column nav-box">
    <div class="box is-hidden-mobile">
      <p class="has-text-left is-size-5 pb-2 pl-2 border-bottom">{{ $t("settings.menu.title") }}</p>
      <b-tabs type="is-boxed" vertical>
        <b-tab-item :label="$t('settings.menu.items.general.title')" icon="tune" class="pt-0 mt-0">
          <general class="width-auto"></general>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.security.title')" icon="key">
          <security class="width-auto"></security>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.addressBook.title')" icon="account-box-multiple-outline">
          <address-book class="width-auto"></address-book>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.did.title')" icon="account-box-multiple-outline" v-if="debugMode">
          <did class="width-auto"></did>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.advanced.title')" icon="lightbulb-outline">
          <advanced class="width-auto"></advanced>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.devhelper.title')" icon="developer-board">
          <dev-helper class="width-auto" :showClose="false"></dev-helper>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.about.title')" icon="information-outline">
          <about class="width-auto"></about>
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="is-hidden-tablet pb-4 pt-8">
      <p class="has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top">{{ $t("settings.menu.title") }}</p>
      <div class="panel-block py-0 my-0" @click="goToGeneral()">
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
      </div>
      <div class="panel-block py-0 my-0" @click="goToSecurity()">
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
      </div>
      <div class="panel-block py-0 my-0" @click="goToAddressBook()">
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
      </div>
      <div class="panel-block py-0 my-0" @click="goToDid()">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="account-box-multiple-outline"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.did.title") }}</p>
            <p class="is-size-7 pt-2 has-text-grey">{{ $t("settings.menu.items.did.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </div>
      <div class="panel-block py-0 my-0" @click="goToAdvanced()">
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
      </div>
      <div class="panel-block py-0 my-0" @click="goToDevHelper()">
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
      </div>
      <div class="panel-block py-0 my-0 border-bottom" @click="goToAbout()">
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
      </div>
      <div class="panel-block my-4">
        <b-button type="is-info" expanded outlined @click="lock()">{{ $t("settings.menu.items.lock") }}</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import DevHelper from "@/components/DevHelper.vue";
import About from "@/components/Settings/About.vue";
import AddressBook from "@/components/Settings/AddressBook.vue";
import Advanced from "@/components/Settings/Advanced.vue";
import Did from "@/components/Settings/Did.vue";
import General from "@/components/Settings/General.vue";
import Security from "@/components/Settings/Security.vue";
import { isDesktop } from "@/services/view/responsive";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component({
  components: { General, Security, Advanced, AddressBook, About, DevHelper, Did },
})
export default class Settings extends Vue {
  goToGeneral(): void {
    this.$buefy.modal.open({
      parent: this,
      component: General,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  goToSecurity(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Security,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  goToAddressBook(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  goToDid(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Did,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  goToAdvanced(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Advanced,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  goToDevHelper(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  goToAbout(): void {
    this.$buefy.modal.open({
      parent: this,
      component: About,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: {},
    });
  }

  lock(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("accountDetail.message.confirmation.lock"),
      confirmText: this.$tc("accountDetail.ui.button.confirm"),
      cancelText: this.$tc("accountDetail.ui.button.cancel"),
      trapFocus: true,
      onConfirm: () => {
        store.dispatch("lock");
      },
    });
  }

  get isDesktop(): boolean {
    return isDesktop();
  }

  get debugMode(): boolean {
    return store.state.app.debug;
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
