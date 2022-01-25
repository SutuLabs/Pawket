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
        <li>First wallet address: TODO</li>
        <li>
          Master private key (m):
          <key-box :value="masterprikey"></key-box>
        </li>
        <li>
          First wallet secret key (m/12381/8444/2/0): &lt;PrivateKey
          <key-box :value="walletprikey"></key-box>&gt;
        </li>
        <li>
          Mnemonic seed (24 secret words):
          <br />
          {{ account.key.compatibleMnemonic }}
          <key-box
            display="✂️"
            tooltip="Copy"
            :value="account.key.compatibleMnemonic"
          ></key-box>
        </li>
      </ul>
    </section>
    <!-- <footer class="modal-card-foot">
      <b-button label="取消" @click="close()"></b-button>
      <b-button label="提交" type="is-primary" @click="raiseTicket"></b-button>
    </footer>-->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store";
import { Account } from "@/store/index";
import utility from "../store/utility";
import { PrivateKey } from "@aguycalled/bls-signatures";
import KeyBox from "@/components/KeyBox.vue";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
  },
})
export default class AccountExport extends Vue {
  @Prop() private account!: Account;
  public masterpubkey = "";
  public masterprikey = "";
  public farmerpubkey = "";
  public poolpubkey = "";
  public walletprikey = "";

  mounted() {
    var privkey = new Uint8Array(
      Object.assign([], this.account.key.privateKey)
    );
    console.log(privkey, this.account.key.privateKey);
    utility.getBLS(privkey).then(({ BLS, sk }) => {
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
