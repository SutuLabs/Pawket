<template>
  <footer class="footer py-4" :class="{ 'is-hidden-mobile': unlocked, 'position-relative': isMobile }">
    <div class="content has-text-centered">
      <p>
        <span class="has-text-weight-bold"> {{ $t("footer.ui.productInfo.name") }}</span>
        <!--<span @click="versionClick()">[{{ version }}]</span>--><span v-if="debugMode" @click="disableDebug()">[DEBUG]</span> by
        <b-icon icon="github" size="is-small"></b-icon
        ><a :href="$t('footer.ui.productInfo.authorLink')" target="_blank" class="has-color-link">{{ $t("footer.ui.productInfo.author") }}</a
        >.
        <br />
        <a href="http://www.frodowallet.com/" target="_blank" size="is-small" class="has-color-link">
          <b-icon icon="home" size="is-small"></b-icon>
          {{ $t("footer.ui.button.home") }}
          <b-icon icon="open-in-new" size="is-small"></b-icon>
        </a>
        |
        <a href="javascript:void(0)" size="is-small" @click="showDebugHelper()" class="has-color-link">
          <b-icon icon="developer-board" size="is-small"></b-icon>
          {{ $t("footer.ui.button.developer") }}
        </a>
      </p>
    </div>
  </footer>
</template>
<script lang="ts">
import { tc } from "@/i18n/i18n";
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { NotificationProgrammatic as Notification } from "buefy";
import { Component, Vue } from "vue-property-decorator";
import DevHelper from "../DevHelper/DevHelper.vue";

@Component({})
export default class PawketFooter extends Vue {
  public debugClick = 9;

  get version(): string {
    return process.env.VUE_APP_VERSION || tc("footer.ui.error.READ_VERSION_FAILED");
  }

  get isMobile(): boolean {
    return isMobile();
  }

  showDebugHelper(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
    });
  }

  versionClick(): void {
    this.debugClick--;
    if (this.debugClick == 0) {
      store.state.app.debug = true;
      Notification.open({
        message: `Debug mode enabled`,
        type: "is-primary",
      });
      localStorage.setItem("DEBUG_MODE", "true");
    }
  }

  disableDebug(): void {
    this.debugClick = 9;
    store.state.app.debug = false;
    Notification.open({
      message: `Debug mode disabled`,
      type: "is-primary",
    });
    localStorage.setItem("DEBUG_MODE", "false");
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }
}
</script>
<style scoped lang="scss">
.footer {
  position: fixed;
  bottom: 0;
  width: 100vw;
  animation: fadeIn 2s;
}

.position-relative {
  position: relative;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
