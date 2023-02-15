<template>
  <div class="modal-card">
    <top-bar :title="$t('accountInfo.ui.title.export')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <ul class="border-bottom">
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold">{{ $t("accountInfo.ui.label.name") }}:</span>
          <span class="is-size-6 is-pulled-right is-clickable" @click="rename()">
            <b-icon icon="pencil" custom-size="mdi-18px" class="pr-2"></b-icon>{{ account.name }}
          </span>
        </li>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold"
            >{{ $t("accountInfo.ui.label.fingerprint") }}
            :
            <b-tooltip :label="$t('accountInfo.ui.tooltip.fingerprintTip')" position="is-top">
              <b-icon icon="help-circle" size="is-small"> </b-icon> </b-tooltip
          ></span>
          <span v-if="!observeMode" class="is-size-6 is-pulled-right">
            <key-box
              icon="checkbox-multiple-blank-outline"
              :tooltip="$t('common.tooltip.copy')"
              :value="account.key.fingerprint"
              :showValue="false"
            ></key-box>
            {{ account.key.fingerprint }}
          </span>
        </li>
        <li class="pb-2">
          <span class="is-size-6 has-text-weight-bold">{{ $t("accountInfo.ui.label.type") }}:</span>
          <span class="is-size-6 is-pulled-right">
            {{ accountTypeConverter(account.type) }}
          </span>
        </li>
      </ul>
      <div class="border-bottom py-2">
        <span class="is-size-6 has-text-weight-bold"
          >{{ $t("accountInfo.ui.label.mnemonicSeed") }}:
          <b-tooltip :label="$t('accountInfo.ui.tooltip.mnemonicTip')" position="is-top">
            <b-icon icon="help-circle" size="is-small"> </b-icon> </b-tooltip
        ></span>
        <span class="is-pulled-right" v-if="!observeMode">
          <b-button v-if="!showMnemonic" size="is-small" @click="show()" class="is-primary">{{
            $t("accountInfo.ui.button.reveal")
          }}</b-button>
          <b-button v-else size="is-small" @click="showMnemonic = false" class="is-link">
            {{ $t("accountInfo.ui.button.hide") }}
          </b-button>
        </span>
        <span v-if="showMnemonic">
          <br />
          {{ account.key.compatibleMnemonic }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('common.tooltip.copy')"
            :value="account.key.compatibleMnemonic"
          ></key-box>
          <qrcode-vue v-if="debugMode" :value="account.key.compatibleMnemonic" size="300" class="qrcode" style="width: 320px"></qrcode-vue>
        </span>
      </div>
      <div class="border-bottom py-2">
        <a
          href="javascript:void(0)"
          class="is-size-6 has-text-weight-bold has-text-dark is-clickable"
          @click="showDetail = !showDetail"
        >
          <div>
            {{ $t("accountInfo.ui.label.details") }}
            <span class="is-pulled-right"><b-icon :icon="showDetail ? 'menu-up' : 'menu-down'"></b-icon></span>
          </div>
        </a>
        <ul v-if="showDetail">
          <li>
            {{ $t("accountInfo.ui.label.masterPublicKey") }}:
            <key-box :value="masterpubkey || account.key.publicKey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountInfo.ui.label.farmerPublicKey") }}:
            <key-box :value="farmerpubkey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountInfo.ui.label.poolPublicKey") }}:
            <key-box :value="poolpubkey" :showValue="true"></key-box>
          </li>
          <li>
            {{ $t("accountInfo.ui.label.firstWalletAddress") }}:
            <key-box :value="account.firstAddress" :showValue="true"></key-box>
          </li>
          <li v-if="debugMode">
            Master PrivateKey:
            <key-box :value="masterprikey" :showValue="true"></key-box>
          </li>
          <li v-if="debugMode">
            First Wallet SecretKey: &lt;PrivateKey
            <key-box :value="walletprikey" :showValue="true"></key-box>&gt;
          </li>
          <li v-if="debugMode">
            First Wallet PublicKey:
            <key-box :value="walletpubkey" :showValue="true"></key-box>
          </li>
        </ul>
      </div>
      <div v-if="debugMode" class="border-bottom py-2">
        <span class="is-size-6 has-text-weight-bold">Get Encrypted Puzzle Detail Tuple</span>
        <span class="is-pulled-right" v-if="!observeMode">
          <b-button v-if="!showPdt" size="is-small" @click="showPdtInfo()" class="is-primary">Calculate</b-button>
          <b-button v-else size="is-small" @click="showPdt = false" class="is-link">
            {{ $t("accountInfo.ui.button.hide") }}
          </b-button>
          <span v-if="showPdt">
            <key-box icon="checkbox-multiple-blank-outline" :tooltip="$t('common.tooltip.copy')" :value="pdtInfo"></key-box>
          </span>
        </span>
      </div>
      <div class="pt-6 px-2" v-if="idx != 0">
        <b-button type="is-danger" outlined expanded @click="remove()">{{ $t("accountInfo.ui.button.delete") }}</b-button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import utility from "@/services/crypto/utility";
import store from "@/store";
import { AccountEntity, AccountType } from "@/models/account";
import { isPasswordCorrect } from "@/store/modules/vault";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import { accountTypeConverter } from "@/filters/accountTypeConversion";
import KeyBox from "@/components/Common/KeyBox.vue";
import TopBar from "@/components/Common/TopBar.vue";
import encryption from "@/services/crypto/encryption";
import QrcodeVue from "qrcode.vue";

@Component({
  components: { TopBar, KeyBox, QrcodeVue },
})
export default class AccountDetail extends Vue {
  @Prop() public idx!: number;
  public masterpubkey = "";
  public masterprikey = "";
  public farmerpubkey = "";
  public poolpubkey = "";
  public walletprikey = "";
  public walletpubkey = "";
  public showMnemonic = false;
  public showPdt = false;
  public pdtInfo = "";
  public showDetail = false;

  mounted(): void {
    window.history.pushState(null, "", "#/home/accounts/detail");
    window.onpopstate = () => this.$emit("close");

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

  accountTypeConverter(accountType: AccountType): string {
    return accountTypeConverter(accountType);
  }

  @Emit("close")
  close(): void {
    return;
  }

  rename(): void {
    this.$emit("rename", this.idx);
  }

  remove(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("accountManagement.message.confirmation.removeAccount", undefined, { accountName: this.account.name }),
      confirmText: this.$tc("accountManagement.message.confirmation.confirmText"),
      cancelText: this.$tc("accountManagement.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("removeAccount", this.idx);
        this.close();
      },
    });
  }

  async show(): Promise<void> {
    this.$buefy.dialog.prompt({
      message: this.$tc("accountInfo.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("common.button.cancel"),
      confirmText: this.$tc("common.button.confirm"),
      onConfirm: async (password, { close }) => {
        if (!(await isPasswordCorrect(password))) {
          this.$buefy.toast.open({
            message: this.$tc("accountInfo.message.passwordNotCorrect"),
            type: "is-danger",
          });
          return;
        }
        close();
        this.showMnemonic = true;
      },
    });
  }

  async showPdtInfo(): Promise<void> {
    this.$buefy.dialog.prompt({
      message: "Input the encryption key",
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("common.button.cancel"),
      confirmText: this.$tc("common.button.confirm"),
      onConfirm: async (key, { close }) => {
        const puz = this.account.addressPuzzles[0].puzzles[1];
        const originData = JSON.stringify({
          privateKey: utility.toHexString(puz.privateKey.serialize()),
          puzzle: puz.puzzle,
          hash: puz.hash,
        });
        this.pdtInfo = await encryption.encrypt(originData, key);
        close();
        this.showPdt = true;
      },
    });
  }
}
</script>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 1px solid #ededed;
}
</style>
