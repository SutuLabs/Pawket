<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offline.proxy.confirmBundle.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field v-if="bundle">
        <template #label>
          {{ $t("offline.proxy.confirmBundle.label.bundle") }}
          <key-box icon="checkbox-multiple-blank" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
          <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
        </template>
        <b-input type="textarea" disabled :value="bundleJson"></b-input>
      </b-field>
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
import KeyBox from "@/components/KeyBox.vue";
import store from "@/store";
import { SpendBundle } from "@/models/wallet";
import TokenAmountField from "@/components/TokenAmountField.vue";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
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

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, (_) => (this.submitting = _), this.close);
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
