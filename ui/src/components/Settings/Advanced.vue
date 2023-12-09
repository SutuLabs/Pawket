<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('settings.advanced.title')" @close="$router.back()"></top-bar>
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
import { notifyPrimary } from "@/services/notification/notification";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

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
        message: this.$tc("settings.advanced.confirmation.experimental"),
        confirmText: this.$tc("common.button.confirm"),
        cancelText: this.$tc("common.button.cancel"),
        trapFocus: true,
        onConfirm: async () => {
          store.state.vault.experiment = true;
          notifyPrimary(this.$tc("common.message.saved"));
          await store.dispatch("persistent");
        },
      });
    } else {
      store.state.vault.experiment = false;
      notifyPrimary(this.$tc("common.message.saved"));
      await store.dispatch("persistent");
    }
  }
}
</script>

<style scoped lang="scss"></style>
