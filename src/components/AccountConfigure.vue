<template>
  <div class="modal-card">
    <section v-if="configureOption === 'Default'">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ $t("accountConfigure.ui.title.settings") }}
        </p>
        <button type="button" class="delete" @click="close()"></button>
      </header>
      <section class="modal-card-body">
        <a
          href="javascript:void(0)"
          :class="displayMaxAddressSlider ? 'panel-block has-background-light' : 'panel-block'"
          @click="toggleChangeAddress()"
        >
          <div class="column is-full">
            <span>{{ $t("accountConfigure.ui.label.receiveAddress") }}</span>
            <b-tooltip :label="$t('accountConfigure.ui.tooltip.receiveAddress')" position="is-bottom" multilined>
              <b-icon icon="help-circle" size="is-small"> </b-icon>
            </b-tooltip>
          </div>
        </a>
        <b-slider v-model="maxAddress" :max="12" :min="1" v-if="displayMaxAddressSlider" indicator></b-slider>
        <a href="javascript:void(0)" class="panel-block" @click="changePassword()">
          <div class="column is-full">
            {{ $t("accountConfigure.ui.button.changePassword") }}
          </div>
        </a>
        <a class="panel-block">
          <div class="column is-full">
            <span>{{ $t("accountConfigure.ui.button.experimental") }}</span>
            <b-switch class="is-pulled-right" :value="experimentMode" @input="toggleExperiment()"></b-switch>
          </div>
        </a>
        <a class="panel-block" href="https://info.pawket.app/privacy-policy/" target="_blank">
          <div class="column is-full">
            <span class="has-text-dark">{{ $t("accountConfigure.ui.label.privacyPolicy") }}</span>
          </div>
        </a>
      </section>
    </section>
    <section v-if="configureOption === 'Password'">
      <change-password @close="close()" @back="back()"></change-password>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store/index";
import KeyBox from "@/components/KeyBox.vue";
import { AccountEntity } from "@/store/modules/account";
import ChangePassword from "./ChangePassword.vue";

@Component({
  components: {
    KeyBox,
    ChangePassword,
  },
})
export default class AccountConfigure extends Vue {
  @Prop() private account!: AccountEntity;
  public maxAddress: number | null = null;
  public displayMaxAddressSlider = false;

  configureOption: "Default" | "Password" = "Default";

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  mounted(): void {
    if (!this.account) {
      console.error("account is empty, cannot get settings");
      return;
    }
    this.maxAddress = this.account.addressRetrievalCount;
  }

  @Emit("close")
  async close(): Promise<void> {
    if (this.maxAddress) this.account.addressRetrievalCount = this.maxAddress;
    await store.dispatch("persistent");
  }

  back(): void {
    this.configureOption = "Default";
  }

  changePassword(): void {
    this.configureOption = "Password";
  }

  toggleChangeAddress(): void {
    this.displayMaxAddressSlider = !this.displayMaxAddressSlider;
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
          await store.dispatch("persistent");
        },
      });
    } else {
      store.state.vault.experiment = false;
      await store.dispatch("persistent");
    }
  }
}
</script>

<style scoped lang="scss"></style>
