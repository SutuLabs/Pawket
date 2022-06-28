<template>
  <div class="modal-card">
    <top-bar :title="$t('settings.advanced.title')" @close="$emit('close')"></top-bar>
    <section class="modal-card-body">
      <b-field>
        <template #label>
          <p class="is-size-4">{{ $t("settings.advanced.label.experimental") }}</p>
          <div class="is-size-7 has-text-grey py-3">
            <p>{{ $t("settings.advanced.description") }}</p>
            <p>{{ $t("settings.advanced.warning") }}</p>
          </div>
        </template>
        <b-switch :value="experimentMode" @click.native.prevent="toggleExperiment()"></b-switch>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import { notifyPrimary } from "@/notification/notification";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "../TopBar.vue";

@Component({
  components: { TopBar },
})
export default class Advanced extends Vue {
  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }
  async toggleExperiment(): Promise<void> {
    if (!this.experimentMode) {
      this.$buefy.dialog.confirm({
        message: this.$tc("accountConfigure.message.confirmation.experiment"),
        confirmText: this.$tc("accountConfigure.ui.button.confirm"),
        cancelText: this.$tc("accountConfigure.ui.button.cancel"),
        trapFocus: true,
        onConfirm: async () => {
          store.state.vault.experiment = true;
          notifyPrimary(this.$tc("accountConfigure.message.notification.saved"));
          await store.dispatch("persistent");
        },
      });
    } else {
      store.state.vault.experiment = false;
      notifyPrimary(this.$tc("accountConfigure.message.notification.saved"));
      await store.dispatch("persistent");
    }
  }
}
</script>

<style scoped lang="scss"></style>
