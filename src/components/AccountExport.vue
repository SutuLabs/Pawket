<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("accountExport.ui.title.export") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <ul>
        <li>{{ $t("accountExport.ui.label.name") }}:{{ account.name }}</li>
        <li>{{ $t("accountExport.ui.label.type") }}:{{ account.type }}</li>
        <li>
          {{ $t("accountExport.ui.label.fingerprint") }}:
          <key-box :value="account.key.fingerprint.toString()"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.masterPublicKey") }}:
          <key-box :value="masterpubkey"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.farmerPublicKey") }}:
          <key-box :value="farmerpubkey"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.poolPublicKey") }}:
          <key-box :value="poolpubkey"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.firstWalletAddress") }}:
          <key-box :value="account.firstAddress"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.masterPrivateKey") }}:
          <key-box :value="masterprikey"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.firstWalletSecretKey") }}: &lt;{{ $t("accountExport.ui.label.PrivateKey") }}
          <key-box :value="walletprikey"></key-box>&gt;
        </li>
        <li>
          {{ $t("accountExport.ui.label.firstWalletPublicKey") }}:
          <key-box :value="walletpubkey"></key-box>
        </li>
        <li>
          {{ $t("accountExport.ui.label.mnemonicSeed") }}:
          <span v-if="showMnemonic">
            <br />
            {{ account.key.compatibleMnemonic }}
            <key-box display="✂️" tooltip="Copy" :value="account.key.compatibleMnemonic"></key-box>
            <qrcode-vue v-if="debugMode" :value="account.key.compatibleMnemonic" size="300"></qrcode-vue>
          </span>
          <span v-else>
            <b-button size="is-small" @click="show()">{{ $t("accountExport.ui.button.revealMnemonic") }}</b-button>
          </span>
        </li>
      </ul>
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
import { translate } from "@/i18n/i18n";

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

  copy(text: string): void {
    store.dispatch("copy", text);
  }

  show(): void {
    this.$buefy.dialog.prompt({
      message: translate("accountExport.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      cancelText: translate("accountExport.ui.button.cancel"),
      confirmText: translate("accountExport.ui.button.confirm"),
      onConfirm: async (password, { close }) => {
        const pswhash = await utility.hash(password);
        if (pswhash != store.state.vault.passwordHash) {
          this.$buefy.toast.open({
            message: translate("accountExport.message.passwordNotCorrect"),
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
