<template>
  <div class="modal-card">
    <top-bar
      :title="mode == 'OFFLINE_CLIENT' ? $t('offline.client.scan.title') : $t('offline.proxy.scan.title')"
      @close="close()"
      :showClose="true"
    ></top-bar>
    <section class="modal-card-body">
      <div class="columns">
        <div v-if="qrcodes.length > 0" class="column">
          <b-field
            :label="mode == 'OFFLINE_CLIENT' ? $t('offline.client.scan.numberField') : $t('offline.proxy.scan.numberField')"
            :message="mode == 'OFFLINE_CLIENT' ? $t('offline.client.scan.numberMessage') : $t('offline.proxy.scan.numberMessage')"
          >
            <b-slider
              v-if="qrcodes.length > 1"
              size="is-large"
              v-model="selectedQr"
              :max="qrcodes.length - 1"
              @change="stopLoop()"
            >
            </b-slider>
          </b-field>

          <center>
            <qrcode-vue :value="qrcodes[qrcodes.length > 1 ? selectedQr : 0]" size="250" class="qrcode" style="width: 270px"></qrcode-vue>
            <div class="is-hidden-tablet" v-if="mode === 'ONLINE_CLIENT'">{{ $t("offline.client.scan.scrollDown") }}</div>
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
      </div>
      <div v-if="mode == 'ONLINE_CLIENT'" class="is-pulled-right"></div>
      <div v-if="mode == 'OFFLINE_CLIENT'" class="is-pulled-right">
        <span class="tag" v-if="receiveTotal > -1">
          {{ $t("offline.client.text.status", { fragment: received, total: receiveTotal }) }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from "vue-qrcode-reader";
import { initCameraHandleError } from "@/services/view/camera";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { networkContext, xchPrefix } from "@/store/modules/network";
import { AccountEntity } from "@/models/account";
import { getAssetsRequestDetail } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
    TopBar,
    QrcodeStream,
    QrcodeDropZone,
    QrcodeCapture,
  },
})
export default class OfflineSpendBundleQr extends Vue {
  @Prop({ default: xchPrefix() }) public prefix!: string;
  @Prop() public bundle!: SpendBundle | undefined;
  @Prop({ default: "OFFLINE_CLIENT" }) public mode!: "OFFLINE_CLIENT" | "ONLINE_CLIENT";
  @Prop() public account!: AccountEntity;

  error = "";
  cameraStatus = "auto";
  cameraInited = false;
  selectedQr = 0;
  looping = true;
  lastScannedAddressTimeMs = 0;
  qrcodes: string[] = [];
  receiveTotal = -1;
  received = 0;
  receives: { [idx: number]: string } = {};
  receiveBundle: SpendBundle | undefined;

  get path(): string {
    return this.$route.path;
  }

  @Watch("bundle")
  async onBundleChange(): Promise<void> {
    if (this.bundle) {
      const ss = await this.splitBundle(this.bundle);
      this.qrcodes = ss;
    }
  }

  @Watch("path")
  onPathChange(): void {
    if (this.mode == "OFFLINE_CLIENT") this.close();
  }

  async splitBundle(bundle: SpendBundle): Promise<string[]> {
    const bstr = await encodeOffer(bundle, 4, "bundle");
    const maxLength = 200;
    const total = Math.ceil(bstr.length / maxLength);
    const partLength = Math.ceil(bstr.length / total);
    const list: string[] = [];
    for (let i = 0; i < total; i++) {
      const part = bstr.slice(i * partLength, (i + 1) * partLength);
      const barr = new Uint8Array([i, total, 0]);
      const pstr = Buffer.from(barr).toString("base64");
      console.assert(pstr.length == 4);
      list.push(pstr + part);
    }
    return list;
  }

  mounted(): void {
    this.setLoop();
    this.onBundleChange();
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
    if (this.path.endsWith("proxy")) this.$router.back();
    return;
  }

  async onDecode(result: string): Promise<void> {
    try {
      if (this.mode == "ONLINE_CLIENT") {
        if (result.startsWith("0x")) {
          this.$emit("signature", result);
          this.close();
        }
      } else if (this.mode == "OFFLINE_CLIENT") {
        const arr = new Uint8Array(Buffer.from(result.slice(0, 4), "base64"));
        const index = arr.at(0);
        const total = arr.at(1);
        if (total === undefined || index === undefined) {
          console.warn("decoding wrong qr", arr, result);
          return;
        }
        this.receiveTotal = total;
        this.received++;
        this.receives[index] = result.slice(4);

        if (Object.keys(this.receives).length == this.receiveTotal) {
          this.cameraStatus = "off";
          let b = "";
          for (let i = 0; i < this.receiveTotal; i++) {
            const r = this.receives[i];
            if (!r) {
              console.warn("failed to join result", result);
              return;
            }

            b += r;
          }

          this.receiveBundle = await decodeOffer(b);
          const requests = await getAssetsRequestDetail(this.account);
          const bundle = await signSpendBundle(this.receiveBundle, requests, networkContext());
          this.qrcodes = [bundle.aggregated_signature];
        }
      }
    } catch (err) {
      console.warn("error when decoding", err);
    }
  }

  async onInit(promise: Promise<void>): Promise<void> {
    promise.then(() => (this.cameraInited = true));
    await initCameraHandleError(promise, async (err) => {
      this.error = err;
    });
  }
}
</script>

<style scoped lang="scss"></style>
