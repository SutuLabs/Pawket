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
        <a class="panel-block">
          <div class="column is-full">
            <b-icon icon="cash" size="is-small" class="mr-2"></b-icon>
            <span>{{ $t("accountConfigure.ui.label.currencyConversion") }}</span>
            <b-select class="is-pulled-right" size="is-small" v-model="currency">
              <option v-for="[key, value] in currencyList" :label="key" :value="value" :key="key">
                {{ key }}
              </option>
            </b-select>
          </div>
        </a>
        <a
          href="javascript:void(0)"
          :class="displayMaxAddressSlider ? 'panel-block has-background-light' : 'panel-block'"
          @click="toggleChangeAddress()"
        >
          <div class="column is-full">
            <b-icon icon="tune-variant" size="is-small" class="mr-2"></b-icon>
            <span>{{ $t("accountConfigure.ui.label.receiveAddress") }}</span>
            <b-tooltip :label="$t('accountConfigure.ui.tooltip.receiveAddress')" position="is-bottom" multilined>
              <b-icon icon="help-circle" size="is-small"> </b-icon>
            </b-tooltip>
          </div>
        </a>
        <b-slider v-model="maxAddress" :max="12" :min="1" v-if="displayMaxAddressSlider" indicator></b-slider>
        <a href="javascript:void(0)" class="panel-block" @click="openAddressBook()">
          <div class="column is-full">
            <b-icon icon="account-box-multiple-outline" size="is-small" class="mr-2"></b-icon>
            {{ $t("accountConfigure.ui.button.addressBook") }}
          </div>
        </a>
        <a href="javascript:void(0)" class="panel-block" @click="changePassword()">
          <div class="column is-full">
            <b-icon icon="key" size="is-small" class="mr-2"></b-icon>
            {{ $t("accountConfigure.ui.button.changePassword") }}
          </div>
        </a>
        <a href="javascript:void(0)" class="panel-block" @click="showMnemonic()">
          <div class="column is-full">
            <b-icon icon="order-alphabetical-ascending" size="is-small" class="mr-2"></b-icon>
            {{ $t("accountConfigure.ui.button.showMnemonic") }}
          </div>
        </a>
        <a class="panel-block">
          <div class="column is-full">
            <b-icon icon="flask" size="is-small" class="mr-2"></b-icon>
            <span>{{ $t("accountConfigure.ui.button.experimental") }}</span>
            <b-switch class="is-pulled-right" :value="experimentMode" @click.native.prevent="toggleExperiment()"></b-switch>
          </div>
        </a>
        <a class="panel-block" href="https://info.pawket.app/privacy-policy/" target="_blank">
          <div class="column is-full">
            <b-icon icon="file-document-outline" size="is-small" class="mr-2"></b-icon>
            <span class="has-text-dark">{{ $t("accountConfigure.ui.label.privacyPolicy") }}</span>
            <b-icon icon="open-in-new" size="is-small"> </b-icon>
          </div>
        </a>
      </section>
    </section>
    <section v-if="configureOption === 'Password'">
      <change-password @close="close()" @back="back()"></change-password>
    </section>
    <section v-if="configureOption === 'AddressBook'">
      <address-book @back="back()"></address-book>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import store from "@/store/index";
import KeyBox from "@/components/KeyBox.vue";
import { AccountEntity } from "@/store/modules/account";
import ChangePassword from "./ChangePassword.vue";
import AddressBook from "./AddressBook.vue";
import { CurrencyType } from "@/services/exchange/currencyType";
import MnemonicExport from "./MnemonicExport.vue";
import { notifyPrimary } from "@/notification/notification";
import { isPasswordCorrect } from "@/store/modules/vault";

@Component({
  components: {
    KeyBox,
    ChangePassword,
    AddressBook,
  },
})
export default class AccountConfigure extends Vue {
  @Prop() private account!: AccountEntity;
  public maxAddress: number | null = null;
  public displayMaxAddressSlider = false;

  configureOption: "Default" | "Password" | "AddressBook" = "Default";
  currencyList: Map<string, CurrencyType> = new Map<string, CurrencyType>([
    ["USD", CurrencyType.USDT],
    ["CNY", CurrencyType.CNY],
  ]);

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get currency(): CurrencyType {
    return store.state.vault.currency ? store.state.vault.currency : CurrencyType.USDT;
  }

  set currency(value: CurrencyType) {
    store.dispatch("setCurrency", value);
    Notification.open({
      message: this.$tc("accountConfigure.message.notification.saved"),
      type: "is-primary",
    });
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
    this.$emit("refresh");
  }

  back(): void {
    this.configureOption = "Default";
  }

  changePassword(): void {
    this.configureOption = "Password";
  }

  openAddressBook(): void {
    this.configureOption = "AddressBook";
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

  showMnemonic(): void {
    this.$buefy.dialog.prompt({
      message: this.$tc("accountExport.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("accountConfigure.ui.button.cancel"),
      confirmText: this.$tc("accountConfigure.ui.button.confirm"),
      onConfirm: async (password, { close }) => {
        if (!await isPasswordCorrect(password)) {
          this.$buefy.toast.open({
            message: this.$tc("accountConfigure.message.error.passwordNotCorrect"),
            type: "is-danger",
          });
          return;
        }
        close();
        this.$buefy.modal.open({
          parent: this,
          component: MnemonicExport,
          hasModalCard: true,
          trapFocus: true,
          canCancel: [""],
          props: { mnemonic: store.state.vault.seedMnemonic },
        });
      },
    });
  }

  @Watch("maxAddress")
  onMaxAddressChange(): void {
    if (this.maxAddress && this.displayMaxAddressSlider) {
      this.account.addressRetrievalCount = this.maxAddress;
      notifyPrimary(this.$tc("accountConfigure.message.notification.saved"));
    }
  }
}
</script>

<style scoped lang="scss"></style>
