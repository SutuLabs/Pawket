<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Account Export</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <ul>
        <li>Name: {{ account.name }}</li>
        <li>Type: {{ account.type }}</li>
        <li>
          Fingerprint:
          <key-box :value="account.key.fingerprint.toString()"></key-box>
        </li>
        <li>
          Master public key (m):
          <key-box :value="masterpubkey"></key-box>
        </li>
        <li>
          Farmer public key (m/12381/8444/0/0):
          <key-box :value="farmerpubkey"></key-box>
        </li>
        <li>
          Pool public key (m/12381/8444/1/0):
          <key-box :value="poolpubkey"></key-box>
        </li>
        <li>First wallet address: <key-box :value="account.firstAddress"></key-box></li>
        <li>
          Master private key (m):
          <key-box :value="masterprikey"></key-box>
        </li>
        <li>
          First wallet secret key (m/12381/8444/2/0): &lt;PrivateKey
          <key-box :value="walletprikey"></key-box>&gt;
        </li>
        <li>
          First wallet public key (m/12381/8444/2/0):
          <key-box :value="walletpubkey"></key-box>
        </li>
        <li>
          Mnemonic seed (24 secret words):
          <span v-if="showMnemonic">
            <br />
            {{ account.key.compatibleMnemonic }}
            <key-box display="✂️" tooltip="Copy" :value="account.key.compatibleMnemonic"></key-box>
            <qrcode-vue :value="account.key.compatibleMnemonic" size="300"></qrcode-vue>
          </span>
          <span v-else>
            <b-button size="is-small" @click="showMnemonic = true">Reveal Mnemonic</b-button>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store";
import { Account } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import utility from '@/services/crypto/utility';

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class AccountExport extends Vue {
  @Prop() private account!: Account;
  public masterpubkey = "";
  public masterprikey = "";
  public farmerpubkey = "";
  public poolpubkey = "";
  public walletprikey = "";
  public walletpubkey = "";
  public showMnemonic = false;

  mounted(): void {
    var privkey = utility.fromHexString(this.account.key.privateKey);
    utility.getBLS(privkey).then(({ sk }) => {
      this.masterprikey = utility.toHexString(sk.serialize());
      this.masterpubkey = utility.toHexString(sk.get_g1().serialize());
    });
    utility.derive(privkey).then((derive) => {
      this.farmerpubkey = utility.toHexString(
        derive([12381, 8444, 0, 0]).get_g1().serialize()
      );
      this.poolpubkey = utility.toHexString(
        derive([12381, 8444, 1, 0]).get_g1().serialize()
      );
      this.walletprikey = utility.toHexString(
        derive([12381, 8444, 2, 0]).serialize()
      );
      this.walletpubkey = utility.toHexString(
        derive([12381, 8444, 2, 0]).get_g1().serialize()
      );
    });
  }

  @Emit("close")
  close(): void {
    return;
  }

  copy(text: string): void {
    store.dispatch("copy", text);
  }
}
</script>

<style scoped lang="scss"></style>
