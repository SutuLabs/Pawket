<template>
  <div class="modal-card">
    <top-bar title="账户详情" @close="close()"></top-bar>
    <section class="modal-card-body">
      <ul class="border-bottom">
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold">{{ $t("accountExport.ui.label.name") }}:</span>
          <span class="is-size-6 is-pulled-right" @click="rename()">
            <b-icon icon="pencil" custom-size="mdi-18px" class="pr-2"></b-icon>{{ account.name }}
          </span>
        </li>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold"
            >{{ $t("accountExport.ui.label.fingerprint") }}
            :
            <b-tooltip :label="$t('accountExport.ui.tooltip.fingerprintTip')" position="is-top">
              <b-icon icon="help-circle" size="is-small"> </b-icon> </b-tooltip
          ></span>
          <span v-if="!observeMode" class="is-size-6 is-pulled-right">
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
      </ul>
      <div class="border-bottom py-2">
        <a href="javascript:void(0)" @click="showMnemonic = !showMnemonic" class="is-size-6 has-text-weight-bold has-text-dark">
          <span class="is-size-6 has-text-weight-bold"
            >{{ $t("accountExport.ui.label.mnemonicSeed") }}:
            <b-tooltip :label="$t('accountExport.ui.tooltip.mnemonicTip')" position="is-top">
              <b-icon icon="help-circle" size="is-small"> </b-icon> </b-tooltip
          ></span>
          <span class="is-pulled-right"><b-icon :icon="showMnemonic ? 'menu-up' : 'menu-down'"></b-icon></span>
        </a>
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
      </div>
      <div class="border-bottom py-2">
        <a href="javascript:void(0)" @click="showDetail = !showDetail" class="is-size-6 has-text-weight-bold has-text-dark">
          {{ $t("accountExport.ui.label.details") }}
          <span class="is-pulled-right"><b-icon :icon="showDetail ? 'menu-up' : 'menu-down'"></b-icon></span>
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
import utility from "@/services/crypto/utility";
import store from "@/store";
import { AccountEntity } from "@/store/modules/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "../KeyBox.vue";
import TopBar from "../TopBar.vue";

@Component({
  components: { TopBar, KeyBox },
})
export default class AccountDetail extends Vue {
  @Prop() private idx!: number;
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

  get account(): AccountEntity {
    return store.state.account.accounts[this.idx] ?? {};
  }

  get observeMode(): boolean {
    return this.account.type == "Address";
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }

  rename(): void {
    this.$emit("rename", this.idx);
  }
}
</script>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 1px solid #ededed;
}
</style>
