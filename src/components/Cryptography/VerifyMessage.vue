<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Verify Message</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field label="Message">
        <b-input type="textarea" v-model="message" rows="18"></b-input>
      </b-field>

      <b-field v-if="verified" label="Result">
        <template #message>
          <ul v-for="(v, i) in validationResult" :key="i">
            <li v-if="v.v == 'Pass'">
              <b-icon icon="check-decagram" type="is-success"></b-icon>
              {{ v.pass }}
            </li>
            <li v-if="v.v == 'None'">
              <b-icon icon="crosshairs-question"></b-icon>
              {{ v.none }}
            </li>
            <li v-if="v.v == 'Fail'">
              <b-icon icon="comment-remove-outline" type="is-danger"></b-icon>
              {{ v.fail }}
            </li>
          </ul>
        </template>
      </b-field>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="$t('batchSend.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
      </div>
      <div>
        <b-button label="Verify" type="is-primary" class="is-pulled-right" @click="verify()" :loading="submitting"></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { analyzeDidCoin } from "@/services/coin/did";
import puzzle from "@/services/crypto/puzzle";
import { prefix0x, unprefix0x } from "@/services/coin/condition";
import { getSignMessage, verifySignature } from "@/services/crypto/sign";
import { rpcUrl } from "@/store/modules/network";
import { CoinSpend } from "@/models/wallet";
import debug from "@/services/api/debug";
import { analyzeNftCoin } from "@/services/coin/nft";

type ValidationResult = "None" | "Pass" | "Fail";

@Component({
  components: {
    KeyBox,
  },
})
export default class VerifyMessage extends Vue {
  @Prop() public initMessage!: string | undefined;

  public submitting = false;
  public verified = false;
  public message = "";
  public signatureValidation: ValidationResult = "None";
  public coinValidation: ValidationResult = "None";

  get validationResult(): { v: ValidationResult; pass: string; fail: string; none: string }[] {
    return [
      {
        v: this.signatureValidation,
        pass: "Signature check pass",
        fail: "Signature check failed",
        none: "Doesn't check signature",
      },
      { v: this.coinValidation, pass: "Coin check pass", fail: "Coin check failed", none: "Doesn't check Coin" },
    ];
  }

  mounted(): void {
    this.message = this.initMessage || this.message;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    if (this.path == "/home") this.close();
  }

  @Emit("close")
  close(): void {
    if (this.path.endsWith("verify-message")) this.$router.back();
    return;
  }

  reset(): void {
    this.verified = false;
  }

  cancel(): void {
    if (this.verified) {
      this.reset();
    } else {
      this.$router.push("/home");
    }
  }

  async verify(): Promise<void> {
    this.submitting = true;
    try {
      this.verified = false;
      this.signatureValidation = "None";
      this.coinValidation = "None";

      const kvp = this.message
        .split("\n")
        .filter((_) => _.indexOf(":") > -1)
        .map((_) => ({ key: _.substring(0, _.indexOf(":")), value: _.substring(_.indexOf(":") + 2).trim() }));
      const msglead = "Message:";
      const msg = this.message.substring(this.message.indexOf(msglead) + msglead.length)?.trim();

      const pk = kvp.find((_) => _.key == "Public Key")?.value;
      const signature = kvp.find((_) => _.key == "Signature")?.value;
      const hint = kvp.find((_) => _.key == "Hint")?.value;

      const did = kvp.find((_) => _.key == "DID")?.value;
      const nft = kvp.find((_) => _.key == "NFT")?.value;
      const xch = kvp.find((_) => _.key == "XCH")?.value;

      if (!pk || !signature || !msg) {
        Notification.open({
          message: "malformat.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      await this.checkSignature(pk, msg, signature);

      if ((nft || did) && !hint) {
        Notification.open({
          message: "Hint is missing.",
          type: "is-danger",
          duration: 5000,
        });
        this.coinValidation = "Fail";
        this.submitting = false;
        return;
      }

      await this.checkCoin(did, nft, xch, hint, prefix0x(await puzzle.getPuzzleHash(pk)));
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
    }

    this.submitting = false;
    this.verified = true;
  }

  async checkSignature(pk: string, msg: string, signature: string): Promise<void> {
    try {
      const signmsg = await getSignMessage(msg);
      const v = verifySignature(pk, signmsg, signature);
      if (!v) {
        this.signatureValidation = "Fail";
        this.verified = true;
        this.submitting = false;
        return;
      }

      this.signatureValidation = "Pass";
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signatureValidation = "Fail";
    }
  }
  async checkCoin(
    did: string | undefined,
    nft: string | undefined,
    xch: string | undefined,
    hint: string | undefined,
    p2owner: string
  ): Promise<void> {
    try {
      const expect =
        did && hint
          ? await this.getCoin(hint, did, async (cs, launcherId) => {
              const d = await analyzeDidCoin(cs.puzzle_reveal, undefined, cs.coin, cs.solution);
              if (unprefix0x(d?.launcherId) != unprefix0x(launcherId)) throw new Error("different launcher id encountered");
              return d?.hintPuzzle ?? "";
            })
          : nft && hint
          ? await this.getCoin(hint, nft, async (cs, launcherId) => {
              const d = await analyzeNftCoin(cs.puzzle_reveal, undefined, cs.coin, cs.solution);
              if (d?.launcherId != launcherId) throw new Error("different launcher id encountered");
              return d?.p2Owner ?? "";
            })
          : xch
          ? xch
          : undefined;

      if (!expect) {
        Notification.open({
          message: "no verify target specified.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        this.coinValidation = "Fail";
        return;
      }

      this.coinValidation = p2owner == expect ? "Pass" : "Fail";
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.coinValidation = "Fail";
    }
  }

  async getCoin(
    coinId: string,
    launcherIdInAddress: string,
    callback: (coinSpend: CoinSpend, launcherId: string) => Promise<string>
  ): Promise<string> {
    const fcoin = await debug.getCoinSolution(coinId, rpcUrl());
    if (fcoin.solution) {
      throw new Error("coin to validate is already invalid(spent).");
    }
    const coin = await debug.getCoinSolution(fcoin.coin.parent_coin_info, rpcUrl());
    const launcherId = await puzzle.getPuzzleHashFromAddress(launcherIdInAddress);
    const s = await callback(coin, launcherId);
    return s;
  }
}
</script>

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.9em;
}
</style>
