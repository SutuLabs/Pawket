<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">
        {{ mode == "OFFLINE_CLIENT" ? $t("offline.client.scan.title") : $t("offline.proxy.scan.title") }}
        <b-tooltip v-if="mode == 'PROXY'" :label="$t('offline.proxy.scan.titleTooltip')" position="is-bottom" multilined>
          <b-icon icon="help-circle" size="is-small" class="px-5"></b-icon>
        </b-tooltip>
      </p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div class="columns">
        <div v-if="qrcodes.length > 0" class="column">
          <b-field
            v-if="qrcodes.length > 1"
            :label="mode == 'OFFLINE_CLIENT' ? $t('offline.client.scan.numberField') : $t('offline.proxy.scan.numberField')"
            :message="mode == 'OFFLINE_CLIENT' ? $t('offline.client.scan.numberMessage') : $t('offline.proxy.scan.numberMessage')"
          >
            <b-slider size="is-large" v-model="selectedQr" :max="qrcodes.length - 1" @change="stopLoop()"> </b-slider>
          </b-field>

          <center>
            <qrcode-vue :value="qrcodes[qrcodes.length > 1 ? selectedQr : 0]" size="250"></qrcode-vue>
          </center>
        </div>
        <div class="column">
          <qrcode-stream v-if="cameraStatus != 'off'" :camera="cameraStatus" @decode="onDecode" @init="onInit" />
        </div>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('offline.ui.button.cancel')" @click="close()"></b-button>
        <b-button
          :label="$t('offline.client.button.finish')"
          v-if="mode == 'OFFLINE_CLIENT'"
          type="is-primary"
          @click="finish()"
          :disabled="!coins || coins.length == 0"
        ></b-button>
      </div>
      <div v-if="mode == 'PROXY'" class="is-pulled-right">
        <span v-if="gettingCoin" class="tag is-info is-light">
          {{ $t("offline.proxy.text.gettingCoins") }}
        </span>
        <span class="tag">
          {{ $t("offline.proxy.text.status", { collected: collectedAddresses.length, queried: queriedAddresses.length }) }}
        </span>
      </div>
      <div v-if="mode == 'OFFLINE_CLIENT'" class="is-pulled-right">
        <span class="tag">
          {{ $t("offline.client.text.status", { coin: coins.length }) }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from "vue-qrcode-reader";
import puzzle, { PuzzleAddress } from "@/services/crypto/puzzle";
import { decodeAddress, initCameraHandleError } from "@/services/view/camera";
import { OriginCoin } from "@/models/wallet";
import coinHandler, { compareOriginCoin } from "@/services/transfer/coin";
import { decodeOffer } from "@/services/offer/encoding";
import OfflineSendConfirmBundle from "./OfflineSendConfirmBundle.vue";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
    QrcodeStream,
    QrcodeDropZone,
    QrcodeCapture,
  },
})
export default class OfflineQrCode extends Vue {
  @Prop({ default: "xch" }) public prefix!: string;
  @Prop({ default: () => [] }) public puzzles!: PuzzleAddress[];
  @Prop({ default: "OFFLINE_CLIENT" }) public mode!: "OFFLINE_CLIENT" | "PROXY";

  error = "";
  cameraStatus = "auto";
  selectedQr = 0;
  looping = true;
  coins: OriginCoin[] = [];
  collectedAddresses: string[] = [];
  queriedAddresses: string[] = [];
  gettingCoin = false;
  lastScannedAddressTimeMs = 0;

  get qrcodes(): string[] {
    if (this.mode == "OFFLINE_CLIENT") {
      return this.puzzles.map((_) => _.address);
    }

    if (this.mode == "PROXY") {
      return this.coins.map((_) => JSON.stringify(_));
    }

    console.warn("unknown mode", this.mode);
    return [];
  }

  mounted(): void {
    this.setLoop();
  }

  setLoop(): void {
    if (!this.looping) return;

    setTimeout(() => {
      if (!this.looping) return;
      this.selectedQr++;
      this.selectedQr %= this.qrcodes.length;
      this.setLoop();
    }, 1000);
  }

  stopLoop(): void {
    if (!this.looping) return;

    this.looping = false;
    // auto restart looping after 20s
    setTimeout(() => {
      this.looping = true;
      this.setLoop();
    }, 20000);
  }

  @Emit("close")
  close(): void {
    this.cameraStatus = "off";
    return;
  }

  async tryGetCoins(): Promise<void> {
    this.lastScannedAddressTimeMs = Date.now();
    const thisScannedTimeMs: number = this.lastScannedAddressTimeMs;

    // delay 3s to get coins altogether
    setTimeout(async () => {
      // if global last is larger then local time, means new job queued
      // drop this job
      if (this.lastScannedAddressTimeMs > thisScannedTimeMs) return;

      // wait for last job finish
      while (this.gettingCoin) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      this.gettingCoin = true;

      try {
        await this.getCoins();
      } catch (err) {
        console.warn("get coin error", err);
      }

      this.gettingCoin = false;
    }, 3000);
  }

  async getCoins(): Promise<void> {
    const queryAddresses = this.collectedAddresses.filter((_) => !this.queriedAddresses.includes(_));
    console.log("get coins", queryAddresses.length);
    if (queryAddresses.length == 0) return;
    const queryHashes = queryAddresses.map<PuzzleAddress>((_) => ({
      hash: puzzle.getPuzzleHashFromAddress(_),
      address: _,
    }));

    const symbol = "ANY";

    const availcoins = await coinHandler.getAvailableCoins([{ symbol, puzzles: queryHashes }], [symbol]);
    for (let i = 0; i < availcoins[symbol].length; i++) {
      const coin = availcoins[symbol][i];
      if (this.coins.findIndex((_) => compareOriginCoin(_, coin)) == -1) this.coins.push(coin);
    }

    this.queriedAddresses.push(...queryAddresses);
  }

  async onDecode(result: string): Promise<void> {
    try {
      if (this.mode == "PROXY") {
        if (result.startsWith("bundle1")) {
          // send bundle
          const bundle = await decodeOffer(result);
          this.$buefy.modal.open({
            parent: this,
            component: OfflineSendConfirmBundle,
            hasModalCard: true,
            trapFocus: false,
            props: { bundle },
          });
        } else {
          // decode address
          const address = decodeAddress(this.prefix, result);
          if (!address) return;

          if (this.collectedAddresses.indexOf(address) == -1) {
            this.collectedAddresses.push(address);
            await this.tryGetCoins();
          }
        }
      } else if (this.mode == "OFFLINE_CLIENT") {
        const coino = JSON.parse(result);
        const coin: OriginCoin = {
          amount: BigInt(coino.amount),
          parent_coin_info: coino.parent_coin_info,
          puzzle_hash: coino.puzzle_hash,
        };
        if (this.coins.findIndex((_) => compareOriginCoin(_, coin)) == -1) this.coins.push(coin);
      }
    } catch (err) {
      console.warn("error when decoding", err);
    }
  }

  async finish(): Promise<void> {
    this.$emit("scanned", this.coins);
    this.close();
  }

  async onInit(promise: Promise<void>): Promise<void> {
    await initCameraHandleError(promise, async (err) => {
      this.error = err;
    });
  }
}
</script>

<style scoped lang="scss"></style>
