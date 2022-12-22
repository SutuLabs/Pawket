<template>
  <confirmation
    :value="signResult"
    :title="$t('signMessage.ui.title')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    @cancel="cancel()"
    @confirm="copy()"
    :confirmBtn="$t('common.button.copy')"
    :loading="submitting"
    :submitting="submitting"
  >
    <template #sign>
      <b-notification type="is-warning is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('signMessage.ui.prompt'))"></span>
      </b-notification>

      <b-field>
        <template #label>
          <span v-if="did">
            {{ $t("signMessage.ui.label.signWdid") }}
            <key-box
              icon="checkbox-multiple-blank-outline"
              :value="signName"
              :tooltip="signName"
              :showValue="true"
              :headLength="30"
              :tailLength="10"
            ></key-box>
          </span>
        </template>
      </b-field>

      <b-field :label="$t('signMessage.ui.label.message')">
        <b-input type="textarea" v-model="message" rows="10"></b-input>
      </b-field>
    </template>
    <template #confirm>
      <b-field v-if="false">
        <b-radio-button v-model="signMode" native-value="Pawket" type="is-primary is-light is-outlined">
          <span>Pawket</span>
        </b-radio-button>

        <b-radio-button v-model="signMode" native-value="Chia CLI" type="is-warning is-light is-outlined">
          <span>Chia CLI</span>
        </b-radio-button>
      </b-field>
      <b-field :label="$t('signMessage.ui.label.result')">
        <b-input type="textarea" v-model="signResult" rows="20"></b-input>
      </b-field>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { AccountEntity } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { NftCoinAnalysisResult } from "@/models/nft";
import { DidCoinAnalysisResult } from "@/services/coin/did";
import store from "@/store";
import puzzle, { PuzzleDetail } from "@/services/crypto/puzzle";
import { prefix0x, unprefix0x } from "@/services/coin/condition";
import utility from "@/services/crypto/utility";
import { getSignMessage, signMessage, verifySignature } from "@/services/crypto/sign";
import { xchPrefix, xchSymbol } from "@/store/modules/network";
import { getCoinName0x } from "@/services/coin/coinUtility";
import Confirmation from "../Common/Confirmation.vue";

@Component({
  components: {
    KeyBox,
    Confirmation,
  },
})
export default class SignMessage extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: NftCoinAnalysisResult | undefined;
  @Prop() public did!: DidCoinAnalysisResult | undefined;
  @Prop() public requests!: PuzzleDetail[];
  @Prop() public xch!: string | undefined;
  @Prop() public initMessage!: string | undefined;

  public submitting = false;
  public signResult = "";
  public pawketSignResult = "";
  public chiaCliSignResult = "";
  public signMode: "Pawket" | "Chia CLI" = "Pawket";
  public message = "";

  mounted(): void {
    this.message = this.initMessage || this.message;
  }

  get path(): string {
    return this.$route.path;
  }

  get signName(): string {
    return this.did
      ? puzzle.getAddressFromPuzzleHash(this.did.launcherId, "did:chia:")
      : this.nft
      ? puzzle.getAddressFromPuzzleHash(this.nft.p2Owner, "nft")
      : this.xch
      ? this.xch
      : "";
  }

  @Emit("close")
  close(): void {
    return;
  }

  @Watch("signMode")
  onSignModeChange(): void {
    this.signResult =
      this.signMode == "Pawket" ? this.pawketSignResult : this.signMode == "Chia CLI" ? this.chiaCliSignResult : "";
  }

  reset(): void {
    this.signResult = "";
  }

  cancel(): void {
    if (this.signResult) {
      this.reset();
    } else {
      this.close();
    }
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (this.message.indexOf('"') > -1) {
        Notification.open({
          message: `Double quotes(") is not supported in message.`,
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const puzzleHash = this.did
        ? this.did.hintPuzzle
        : this.nft
        ? this.nft.p2Owner
        : this.xch
        ? puzzle.getPuzzleHashFromAddress(this.xch)
        : undefined;
      const phResult = this.did
        ? `DID: ${puzzle.getAddressFromPuzzleHash(this.did.launcherId, "did:chia:")}`
        : this.nft
        ? `NFT: ${puzzle.getAddressFromPuzzleHash(this.nft.launcherId, "nft")}`
        : this.xch
        ? `XCH: ${puzzle.getAddressFromPuzzleHash(this.xch, xchPrefix())}`
        : undefined;
      const phHint = this.did ? getCoinName0x(this.did.coin) : this.nft ? getCoinName0x(this.nft.coin) : undefined;
      if (!puzzleHash || !phResult) {
        Notification.open({
          message: "No target specified.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      if (!this.message) {
        Notification.open({
          message: "Message cannot be empty.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const requests = this.requests ?? this.account.addressPuzzles.find((_) => _.symbol == xchSymbol())?.puzzles;
      if (!requests) {
        Notification.open({
          message: "Account initialization not finish.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const sk = requests.find((_) => prefix0x(_.hash) == prefix0x(puzzleHash))?.privateKey;
      if (!sk) {
        Notification.open({
          message: "Private key cannot be found.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const pk = prefix0x(utility.toHexString(sk.get_g1().serialize()));
      this.message = this.message.trim();
      const msg = await getSignMessage(this.message);
      const { signature, syntheticPublicKey } = signMessage(sk, msg);
      const v = verifySignature(pk, msg, signature);
      if (!v) throw new Error("failed to sign a valid signature");

      const msghash = prefix0x(utility.toHexString(msg));
      this.pawketSignResult = `Public Key: ${prefix0x(pk)}
Synthetic Key: ${prefix0x(syntheticPublicKey)}
Signature: ${prefix0x(signature)}
${phResult}${phHint ? "\nHint: " + phHint : ""}
Message Hash: ${msghash}
Message:
${this.message}`;
      this.chiaCliSignResult =
        this.message.indexOf("\n") > -1
          ? "Message with multiple line is not supported to executed in Chia CLI."
          : `chia keys verify -s ${unprefix0x(signature)} -p ${unprefix0x(syntheticPublicKey)} -d ${msghash}`;

      this.onSignModeChange();
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.submitting = false;
    }
    this.submitting = false;
    this.$emit("signResult", this.signResult);
  }

  copy(): void {
    store.dispatch("copy", this.signResult);
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.9em;
}
</style>
