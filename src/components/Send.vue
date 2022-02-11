<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("send.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('send.ui.label.address')">
        <b-input v-model="address" @change="reset()" expanded></b-input>
        <p class="control">
          <b-button @click="scanQrCode()">
            <b-icon icon="qrcode"></b-icon>
          </b-button>
        </p>
      </b-field>
      <b-field :message="amountMessage">
        <template #label>
          {{ $t("send.ui.label.amount") }}
          <span class="is-pulled-right is-size-6">
            <b-button type="is-info is-light" size="is-small" @click="setMax(maxAmount)">
              <span v-if="maxStatus == 'Loading'">Loading {{ selectedToken }}</span>
              <span v-if="maxStatus == 'Loaded'">Max: {{ maxAmount }} / {{ totalAmount }} {{ selectedToken }}</span>
            </b-button>
            <b-tooltip :triggers="['click']" :auto-close="['outside', 'escape']" position="is-left" type="is-light">
              <template v-slot:content>
                Currently only support one code mode,
                <a href="https://pawket.app" target="_blank">
                  Learn more
                  <b-icon icon="open-in-new" size="is-small"></b-icon>
                </a>
              </template>
              <b-icon icon="comment-question" size="is-small" type="is-info" class="px-4"></b-icon>
            </b-tooltip>
          </span>
        </template>
        <b-select v-model="selectedToken" @input="loadCoins()">
          <option v-for="token in tokenNames" :key="token" :value="token">
            {{ token }}
          </option>
        </b-select>
        <b-input v-model="amount" expanded @input="reset()"></b-input>
        <p class="control">
          <span class="button is-static">{{ selectedToken }}</span>
        </p>
      </b-field>
      <b-field :label="$t('send.ui.label.memo')">
        <b-input maxlength="100" v-model="memo" type="text" @input="reset()" :disabled="selectedToken == 'XCH'"></b-input>
      </b-field>
      <b-field v-if="bundle">
        <template #label>
          {{ $t("message.bundle") }}
          <key-box display="✂️" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
          <a href="javascript:void(0)" @click="debugBundle()">🐞</a>
        </template>
        <b-input type="textarea" disabled :value="bundleJson"></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <b-button :label="$t('send.ui.button.cancel')" @click="close()"></b-button>
      <b-button
        :label="$t('send.ui.button.submit')"
        v-if="bundle"
        type="is-primary"
        @click="submit()"
        :disabled="submitting"
      ></b-button>
      <b-button
        :label="$t('send.ui.button.sign')"
        v-if="!bundle"
        type="is-success"
        @click="sign()"
        :disabled="submitting"
      ></b-button>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { AccountEntity, TokenInfo } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { ApiResponse } from "@/models/api";
import receive from "../services/crypto/receive";
import store from "@/store";
import { CoinItem, SpendBundle, CoinRecord } from "@/models/wallet";
import utility from "@/services/crypto/utility";
import puzzle from "@/services/crypto/puzzle";
import DevHelper from "@/components/DevHelper.vue";
import catBundle from "@/services/transfer/catBundle";
import stdBundle from "@/services/transfer/stdBundle";
import bigDecimal from "js-big-decimal";
import ScanQrCode from "@/components/ScanQrCode.vue";

@Component({
  components: {
    KeyBox,
  },
})
export default class Send extends Vue {
  @Prop() private account!: AccountEntity;
  public submitting = false;
  public amount = 0;
  public address = "";
  public selectedToken = "XCH";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public coins: CoinRecord[] = [];
  public maxAmount = -1;
  public totalAmount = -1;
  public INVALID_AMOUNT_MESSAGE = "Invalid amount";
  public maxStatus: "Loading" | "Loaded" = "Loading";

  mounted(): void {
    this.loadCoins();
  }

  @Emit("close")
  close(): void {
    return;
  }

  get amountMessage(): string {
    if (!this.amount) return "";
    try { new bigDecimal(this.amount); }
    catch { return ""; }
    if (this.amount == 0) return "";

    if (this.amount > this.maxAmount) return this.INVALID_AMOUNT_MESSAGE;

    const decimal = this.selectedToken == "XCH" ? 12 : 3;
    const mojo = bigDecimal.multiply(this.amount, Math.pow(10, decimal));
    if (Number(mojo) < 1) return this.INVALID_AMOUNT_MESSAGE;
    return bigDecimal.getPrettyValue(mojo, 3, ",") + " mojos";
  }

  get tokenNames(): string[] {
    return Object.keys(store.state.account.tokenInfo).concat(this.account.cats.map((_) => _.name));
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  reset(): void {
    this.bundle = null;
  }

  get tokenInfo(): TokenInfo {
    const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
    if (this.account.cats) {
      for (let i = 0; i < this.account.cats.length; i++) {
        const cat = this.account.cats[i];
        tokenInfo[cat.name] = {
          id: cat.id,
          symbol: cat.name,
          decimal: 3,
          unit: cat.name,
        };
      }
    }

    return tokenInfo;
  }

  setMax(amount: number): void {
    this.amount = amount;
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.maxStatus = "Loading";

    const maxId = this.account.addressRetrievalCount;
    const sk_hex = this.account.key.privateKey;
    const requests = await receive.getAssetsRequestDetail(sk_hex, maxId, this.account.cats ?? []);
    const tgtreqs = requests.filter(_ => _.symbol == this.selectedToken);

    this.coins = await receive.getCoinRecords(tgtreqs, false);
    const availcoins = this.coins.map(_ => _.coin?.amount ?? 0);
    this.maxAmount = Math.max(...availcoins, 0);
    this.totalAmount = availcoins.reduce((a, b) => a + b, 0);
    this.maxStatus = "Loaded";
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (!this.account.firstAddress) {
        this.submitting = false;
        return;
      }

      const sk_hex = this.account.key.privateKey;
      const decimal = this.selectedToken == "XCH" ? 12 : 3;
      const amount = BigInt(this.amount * Math.pow(10, decimal));

      const filteredCoins =
        this.coins.filter(_ => _.coin).map(_ => _.coin as CoinItem).map(_ => ({
          amount: BigInt(_.amount),
          parent_coin_info: _.parentCoinInfo,
          puzzle_hash: _.puzzleHash,
        }));


      if (this.selectedToken == "XCH") {
        const puzzles = await puzzle.getPuzzleDetails(utility.fromHexString(sk_hex), 0, 5);
        this.bundle = await stdBundle.generateSpendBundle(
          filteredCoins, puzzles, this.address, amount, 0n, this.account.firstAddress);
      }
      else {
        const assetId = this.tokenInfo[this.selectedToken].id ?? "";
        const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, 0, 30);
        this.bundle = await catBundle.generateCatSpendBundle(
          filteredCoins, puzzles, this.address, amount, 0n, this.account.firstAddress, this.memo);

      }

    } catch (error) {
      Notification.open({
        message: `failed to sign: ${error}`,
        type: "is-danger",
      });
      console.warn(error);
      this.submitting = false;
    }
    this.submitting = false;
  }

  async submit(): Promise<void> {
    this.submitting = true;

    try {
      const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/pushtx", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bundle: this.bundle }),
      });
      const json = (await resp.json()) as ApiResponse;
      this.submitting = false;
      if (json.success) {
        Notification.open({
          message: `Submitted to memory pool.`,
          type: "is-success",
        });
        this.close();
      } else {
        Notification.open({
          message: `Submit failed: ${json.error}`,
          type: "is-danger",
        });
      }
    } catch (error) {
      Notification.open({
        message: `failed to submit: ${error}`,
        type: "is-danger",
      });
      console.warn(error);
      this.submitting = false;
    }
  }

  debugBundle(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      props: { inputBundleText: this.bundleJson },
    });
  }

  scanQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ScanQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        "scanned": (value: string): void => {
          this.address = value;
        },
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
