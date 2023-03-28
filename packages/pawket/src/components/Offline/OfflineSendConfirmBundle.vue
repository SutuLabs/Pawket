<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offline.proxy.confirmBundle.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($tc('offline.proxy.confirmBundle.notification'))"></span>
        </b-notification>
        <bundle-summary :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('offline.proxy.confirmBundle.button.cancel')" @click="close()"></b-button>
      </div>
      <div>
        <b-button
          :label="$t('offline.proxy.confirmBundle.button.submit')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import store from "@/store";
import { SpendBundle } from "@/services/spendbundle";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import { AccountEntity } from "@/models/account";

@Component({
  components: {
    KeyBox,
    BundleSummary,
  },
})
export default class OfflineSendConfirmBundle extends Vue {
  @Prop() public bundle!: SpendBundle;
  public submitting = false;

  @Emit("close")
  close(): void {
    return;
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.close);
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.6em;
}
</style>
