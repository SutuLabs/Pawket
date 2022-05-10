<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("accountExport.ui.title.export") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <ul>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold">{{ $t("accountExport.ui.label.name") }}:</span>
          <span class="is-size-6 is-pulled-right">
            {{ account.name }}
          </span>
        </li>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold"
            >{{ $t("accountExport.ui.label.fingerprint") }}
            :
            <b-tooltip :label="$t('accountExport.ui.tooltip.fingerprintTip')" position="is-top">
              <b-icon icon="help-circle" size="is-small"> </b-icon> </b-tooltip
          ></span>
          <span class="is-size-6 is-pulled-right">
            <key-box
              icon="checkbox-multiple-blank-outline"
              :tooltip="$t('accountExport.ui.tooltip.copy')"
              :value="account.key.fingerprint"
              :showValue="false"
            ></key-box>
            {{ account.key.fingerprint }}
          </span>
        </li>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold">{{ $t("accountExport.ui.label.type") }}:</span>
          <span class="is-size-6 is-pulled-right">
            {{ account.type }}
          </span>
        </li>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold"
            >{{ $t("accountExport.ui.label.mnemonicSeed") }}:
            <b-tooltip :label="$t('accountExport.ui.tooltip.mnemonicTip')" position="is-top">
              <b-icon icon="help-circle" size="is-small"> </b-icon> </b-tooltip
          ></span>
          <span class="is-pulled-right">
            <b-button v-if="!showMnemonic" size="is-small" @click="show()" class="is-primary">{{
              $t("accountExport.ui.button.reveal")
            }}</b-button>
            <b-button v-else size="is-small" @click="showMnemonic = false" class="is-link">
              {{ $t("accountExport.ui.button.hide") }}
            </b-button>
          </span>
          <span v-if="showMnemonic">
            <br />
            {{ account.key.compatibleMnemonic }}
            <key-box
              icon="checkbox-multiple-blank-outline"
              :tooltip="$t('accountExport.ui.tooltip.copy')"
              :value="account.key.compatibleMnemonic"
            ></key-box>
            <qrcode-vue v-if="debugMode" :value="account.key.compatibleMnemonic" size="300"></qrcode-vue>
          </span>
        </li>
      </ul>
      <div class="pt-4">
        <a href="javascript:void(0)" @click="showDetail = !showDetail" class="is-size-6 has-text-weight-bold has-text-dark">
          {{ $t("accountExport.ui.label.details") }}<b-icon :icon="showDetail ? 'menu-up' : 'menu-down'"></b-icon>
        </a>
        <ul v-if="showDetail">
          <li>
            {{ $t("accountExport.ui.label.masterPublicKey") }}:
            <key-box :value="masterpubkey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountExport.ui.label.farmerPublicKey") }}:
            <key-box :value="farmerpubkey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountExport.ui.label.poolPublicKey") }}:
            <key-box :value="poolpubkey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountExport.ui.label.firstWalletAddress") }}:
            <key-box :value="account.firstAddress" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountExport.ui.label.masterPrivateKey") }}:
            <key-box :value="masterprikey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountExport.ui.label.firstWalletSecretKey") }}: &lt;{{ $t("accountExport.ui.label.PrivateKey") }}
            <key-box :value="walletprikey" :showValue="true"></key-box>&gt;
          </li>
          <li>
            {{ $t("accountExport.ui.label.firstWalletPublicKey") }}:
            <key-box :value="walletpubkey" :showValue="true"></key-box>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store";
import { AccountEntity } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import utility from "@/services/crypto/utility";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class AccountExport extends Vue {
  @Prop() private account!: AccountEntity;
  public masterpubkey = "";
  public masterprikey = "";
  public farmerpubkey = "";
  public poolpubkey = "";
  public walletprikey = "";
  public walletpubkey = "";
  public showMnemonic = false;
  public showDetail = false;

  mounted(): void {
    var privkey = utility.fromHexString(this.account.key.privateKey);
    utility.getPrivateKey(privkey).then((sk) => {
      this.masterprikey = utility.toHexString(sk.serialize());
      this.masterpubkey = utility.toHexString(sk.get_g1().serialize());
    });
    utility.derive(privkey).then((derive) => {
      this.farmerpubkey = utility.toHexString(derive([12381, 8444, 0, 0]).get_g1().serialize());
      this.poolpubkey = utility.toHexString(derive([12381, 8444, 1, 0]).get_g1().serialize());
      this.walletprikey = utility.toHexString(derive([12381, 8444, 2, 0]).serialize());
      this.walletpubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
    });
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }

  show(): void {
    this.$buefy.dialog.prompt({
      message: this.$tc("accountExport.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("accountExport.ui.button.cancel"),
      confirmText: this.$tc("accountExport.ui.button.confirm"),
      onConfirm: async (password, { close }) => {
        const pswhash = await utility.hash(password);
        if (pswhash != store.state.vault.passwordHash) {
          this.$buefy.toast.open({
            message: this.$tc("accountExport.message.passwordNotCorrect"),
            type: "is-danger",
          });
          this.showMnemonic = false;
          return;
        }
        close();
        this.showMnemonic = true;
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
