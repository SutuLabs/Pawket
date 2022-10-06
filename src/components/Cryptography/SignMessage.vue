<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Sign Message</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="!signResult">
        <b-notification type="is-warning is-light" has-icon icon="head-question-outline" :closable="false">
          <span
            v-html="
              $sanitize(
                'Make sure the message is come from trust source, if you don\'t understand or agree to the message, don\'t sign!'
              )
            "
          ></span>
        </b-notification>

        <b-field>
          <template #label>
            <span v-if="did">
              Sign with DID:
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

        <b-field label="Message">
          <b-input type="textarea" v-model="message" rows="10"></b-input>
        </b-field>
      </template>
      <template v-else>
        <b-field label="Result">
          <b-input type="textarea" v-model="signResult" rows="20"></b-input>
        </b-field>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="$t('batchSend.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="$t('batchSend.ui.button.sign')"
          v-if="!signResult"
          type="is-primary"
          @click="sign()"
          :loading="submitting"
        ></b-button>
      </div>
      <div>
        <b-button label="Copy" v-if="signResult" type="is-primary" class="is-pulled-right" @click="copy()"></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { AccountEntity } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { NftCoinAnalysisResult } from "@/models/nft";
import { DidCoinAnalysisResult } from "@/services/coin/did";
import store from "@/store";
import puzzle from "@/services/crypto/puzzle";
import { prefix0x } from "@/services/coin/condition";
import utility from "@/services/crypto/utility";
import { getSignMessage, signMessage, verifySignature } from "@/services/crypto/sign";
import { xchPrefix } from "@/store/modules/network";
import { getCoinName0x } from "@/services/coin/coinUtility";

@Component({
  components: {
    KeyBox,
  },
})
export default class SignMessage extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: NftCoinAnalysisResult | undefined;
  @Prop() public did!: DidCoinAnalysisResult | undefined;
  @Prop() public xch!: string | undefined;
  @Prop() public initMessage!: string | undefined;

  public submitting = false;
  public signResult = "";
  public message = "";

  mounted(): void {
    this.message = this.initMessage || this.message;
  }

  get path(): string {
    return this.$route.path;
  }

  get signName(): string {
    return this.did
      ? puzzle.getAddressFromPuzzleHash(this.did.hintPuzzle, "did:chia:")
      : this.nft
      ? puzzle.getAddressFromPuzzleHash(this.nft.p2Owner, "nft")
      : this.xch
      ? this.xch
      : "";
  }

  @Watch("path")
  onPathChange(): void {
    if (this.path == "/home") this.close();
  }

  @Emit("close")
  close(): void {
    if (this.path.endsWith("sign-message")) this.$router.back();
    return;
  }

  reset(): void {
    this.signResult = "";
  }

  cancel(): void {
    if (this.signResult) {
      this.reset();
    } else {
      this.$router.push("/home");
    }
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (this.message.indexOf("\"")>-1) {
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

      const privkey = this.account.key.privateKey;
      const requests = await puzzle.getPuzzleDetails(privkey, "xch", 0, 10);
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
      // const { signature, syntheticPublicKey } = signMessage(sk, msg);
      const { signature } = signMessage(sk, msg);
      const v = verifySignature(pk, msg, signature);
      if (!v) throw new Error("failed to sign a valid signature");

      this.signResult = `Public Key: ${prefix0x(pk)}
Signature: ${prefix0x(signature)}
${phResult}${phHint ? "\nHint: " + phHint : ""}
Message:
${this.message}`;
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
