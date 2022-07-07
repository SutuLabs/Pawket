<template>
  <div class="column is-8 is-offset-2">
    <div class="box is-hidden-touch">
      <p class="has-text-left is-size-5 pb-2 pl-2 border-bottom">{{ $t("settings.menu.title") }}</p>
      <b-tabs type="is-boxed" vertical>
        <b-tab-item :label="$t('settings.menu.items.general.title')" icon="tune" class="pt-0 mt-0">
          <general></general>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.security.title')" icon="key">
          <security></security>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.addressBook.title')" icon="account-box-multiple-outline">
          <address-book></address-book>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.advanced.title')" icon="lightbulb-outline">
          <advanced></advanced>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.donate.title')" icon="hand-heart-outline">
          <donate :showClose="false"></donate>
        </b-tab-item>
        <b-tab-item :label="$t('settings.menu.items.about.title')" icon="information-outline">
          <about></about>
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="is-hidden-desktop">
      <p class="has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom">{{ $t("settings.menu.title") }}</p>
      <div class="panel-block py-0 my-0" @click="goToGeneral()">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="tune"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.general.title") }}</p>
            <p class="is-size-7 pt-2">{{ $t("settings.menu.items.general.description") }}</p>
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
            <p class="is-size-7 pt-2">{{ $t("settings.menu.items.security.description") }}</p>
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
            <p class="is-size-7 pt-2">{{ $t("settings.menu.items.addressBook.description") }}</p>
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
            <p class="is-size-7 pt-2">{{ $t("settings.menu.items.advanced.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </div>
      <div class="panel-block py-0 my-0" @click="goToDonate()">
        <div class="is-11 is-flex my-1 py-1">
          <div class="mr-2 py-1">
            <b-icon icon="hand-heart-outline"></b-icon>
          </div>
          <div class="py-1">
            <p>{{ $t("settings.menu.items.donate.title") }}</p>
            <p class="is-size-7 pt-2">{{ $t("settings.menu.items.donate.description") }}</p>
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
            <p class="is-size-7 pt-2">{{ $t("settings.menu.items.about.description") }}</p>
          </div>
        </div>
        <div class="column py-1">
          <b-icon class="is-pulled-right has-text-grey" icon="chevron-right"> </b-icon>
        </div>
      </div>
      <div class="panel-block mt-4">
        <b-button type="is-info" expanded outlined @click="lock()">{{ $t("settings.menu.items.lock") }}</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import About from "@/components/Settings/About.vue";
import AddressBook from "@/components/Settings/AddressBook.vue";
import Advanced from "@/components/Settings/Advanced.vue";
import Donate from "@/components/Settings/Donate.vue";
import General from "@/components/Settings/General.vue";
import Security from "@/components/Settings/Security.vue";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component({
  components: { General, Security, Advanced, AddressBook, Donate, About },
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

  goToDonate(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Donate,
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
        this.$router.push("/");
        store.dispatch("lock");
      },
    });
  }
}
</script>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 1px solid #ededed;
  border-radius: 0;
}
</style>
