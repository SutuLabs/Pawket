<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("send.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('send.ui.label.address')">
        <b-input v-model="address" @change="reset()"></b-input>
      </b-field>
      <b-field :label="$t('send.ui.label.amount')" :message="amountMessage">
        <b-select v-model="selectedToken" @change="reset()">
          <option v-for="token in tokenNames" :key="token" :value="token">
            {{ token }}
          </option>
        </b-select>
        <b-input v-model="amount" expanded @change="reset()"></b-input>
        <p class="control">
          <span class="button is-static">{{ selectedToken }}</span>
        </p>
      </b-field>
      <b-field :label="$t('send.ui.label.memo')">
        <b-input maxlength="100" type="text" :disabled="selectedToken == 'XCH'"></b-input>
      </b-field>
      <b-field v-if="bundle" :label="$t('message.bundle')">
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
import { Account } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import transfer from "../services/crypto/transfer";
import { ApiResponse } from "@/models/api";
import receive from "../services/crypto/receive";
import store from "@/store";
import { CoinItem, SpendBundle } from "@/models/wallet";

@Component({
  components: {
    KeyBox,
  },
})
export default class Send extends Vue {
  @Prop() private account!: Account;
  public amount = 0;
  public submitting = false;
  public address = "";
  public selectedToken = "XCH";
  public bundle: SpendBundle | null = null;

  @Emit("close")
  close(): void {
    return;
  }

  get amountMessage(): string {
    if (!this.amount) return "";
    function numberWithCommas(x: number): string {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    const decimal = this.selectedToken == "XCH" ? 12 : 3;
    return numberWithCommas(this.amount * Math.pow(10, decimal)) + " mojos";
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

  async sign(): Promise<void> {
    this.submitting = true;
    const maxId = 4;
    const requests = await receive.getAssetsRequestDetail(this.account.key.privateKey, maxId, this.account.cats ?? []);
    const tgtreqs = requests.filter((_) => _.symbol == this.selectedToken);

    const coins = await receive.getCoinRecords(tgtreqs);
    if (!this.account.firstAddress) {
      this.submitting = false;
      return;
    }
    const decimal = this.selectedToken == "XCH" ? 12 : 3;
    const amount = BigInt(this.amount * Math.pow(10, decimal));

    this.bundle = await transfer.generateSpendBundle(
      coins
        .filter((_) => _.coin)
        .map((_) => _.coin as CoinItem)
        .map((_) => ({
          amount: BigInt(_.amount),
          parent_coin_info: _.parentCoinInfo,
          puzzle_hash: _.puzzleHash,
        })),
      this.account.key.privateKey,
      this.address,
      amount,
      0n,
      this.account.firstAddress
    );

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
      this.submitting = false;
    }
  }
}
</script>

<style scoped lang="scss"></style>
