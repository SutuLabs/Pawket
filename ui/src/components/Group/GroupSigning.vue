<template>
  <div class="modal-card">
    <top-bar :title="$t('groupSigning.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-field>
        <template #label>
          {{ $t("groupSigning.ui.label.aggregatedPublicKey") }}
        </template>
        <template #message>
          {{ $t("groupSigning.ui.label.explanation") }}
        </template>
        {{ account.name }}
        <key-box
          icon="checkbox-multiple-blank-outline"
          :value="account.key.publicKey"
          :showValue="true"
          position="is-right"
        ></key-box>
      </b-field>
      <div v-for="(publicKey, index) in account.key.publicKeys" :key="index">
        <b-field :type="errorMessages[index] ? 'is-danger' : ''">
          <template #label>
            {{ $t("groupSigning.ui.label.publicKey") }} {{ index + 1 }}

            <key-box icon="checkbox-multiple-blank-outline" :value="publicKey" :showValue="true"></key-box>
          </template>
          <template #message>
            {{ errorMessages[index] }}
          </template>
          <p class="control">
            <span v-if="signatures[index]">{{ $t("addByAddress.ui.label.signed") }}</span>
            <template v-else>
              <b-button @click="scanQrCode(index)">
                <b-icon icon="qrcode"></b-icon>
              </b-button>
              <b-button @click="signByEncryptedMessage(index)">
                <b-icon icon="message-text-lock-outline"></b-icon>
              </b-button>
            </template>
          </p>
        </b-field>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('groupSigning.ui.button.back')" @click="close()"></b-button>
      <b-button :label="$t('groupSigning.ui.button.submit')" type="is-primary" @click="submit()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import TopBar from "@/components/Common/TopBar.vue";
import { Hex0x, unprefix0x } from "../../../../lib-chia/services/coin/condition";
import KeyBox from "@/components/Common/KeyBox.vue";
import { xchPrefix } from "@/store/modules/network";
import {
  combineSpendBundleSignature,
  MessagesToSign,
  signMessagesForAggregateKey,
  SpendBundle,
} from "../../../../lib-chia/services/spendbundle";
import { AccountEntity } from "../../../../lib-chia/models/account";
import { offlineSignBundle } from "@/services/view/bundleAction";
import { getAssetsRequestDetail } from "@/services/view/coinAction";
import utility from "../../../../lib-chia/services/crypto/utility";

@Component({ components: { TopBar, KeyBox } })
export default class GroupSigning extends Vue {
  @Prop({ default: xchPrefix() }) public prefix!: string;
  @Prop() public bundle!: SpendBundle | undefined;
  @Prop() public messagesToSign!: MessagesToSign | undefined;
  @Prop() public account!: AccountEntity;

  public name = "";
  public publicKeys: string[] = ["", ""];
  public errorMessages: string[] = ["", ""];
  public loading = false;
  public signatures: [Hex0x?, Hex0x?] = [undefined, undefined];
  public syntheticKeySigned = false;

  close(): void {
    this.$emit("close");
  }

  async submit(): Promise<void> {
    if (!this.signatures[0] || !this.signatures[1]) return;
    if (!this.bundle) return;

    const bundle = await combineSpendBundleSignature(this.bundle, [this.signatures[0], this.signatures[1]]);
    this.$emit("signature", bundle.aggregated_signature);
    this.close();
  }

  async scanQrCode(index: number): Promise<void> {
    if (!this.bundle || !this.messagesToSign) return;
    await offlineSignBundle(this, this.bundle, this.messagesToSign, (sig) => {
      this.signatures[index] = sig;
    });
  }

  async signByEncryptedMessage(_index: number): Promise<void> {
    //
  }

  async mounted(): Promise<void> {
    //
    if (!this.account.key.publicKeys || !this.account.key.publicKey) {
      console.warn("the account public keys are not initialized.");
      return;
    }

    if (!this.bundle || !this.messagesToSign) {
      console.warn("the bundle or messagesToSign should not empty.");
      return;
    }

    const publicKeys = this.account.key.publicKeys.map((_) => unprefix0x(_));
    const aggpk = this.account.key.publicKey;

    // sign by local secret key
    for (const acc of store.state.account.accounts) {
      // console.log("acc key", acc.key.publicKey);
      if (acc.type === "PublicKey" || acc.type === "2-2Keys") continue;

      const sk = await utility.getPrivateKey(utility.fromHexString(acc.key.privateKey));
      const pubkey = utility.toHexString(sk.get_g1().serialize());
      const index = publicKeys.findIndex((key) => pubkey === key);
      if (!this.signatures[index] && index > -1) {
        const requests = await getAssetsRequestDetail(acc);
        const sig = await signMessagesForAggregateKey(this.messagesToSign, aggpk, sk, !this.syntheticKeySigned);
        this.syntheticKeySigned = true;
        Vue.set(this.signatures, index, sig);
        // this.signatures[index] = sig;
      }
    }

    console.log("signatures", this.signatures);
  }
}
</script>

<style scoped></style>
