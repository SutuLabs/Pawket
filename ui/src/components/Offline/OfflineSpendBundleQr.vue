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

          <b-field v-if="unsafeQrcodes.length > 0">
            <b-switch v-model="isUnsafe" type="is-danger">
              {{ $t("offline.client.text.unsafeMode") }}
            </b-switch>
          </b-field>

          <center>
            <qrcode-vue
              :value="qrcodes[qrcodes.length > 1 ? selectedQr : 0]"
              size="250"
              class="qrcode"
              style="width: 270px"
            ></qrcode-vue>
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
      <div v-if="mode == 'ONLINE_CLIENT'" class="is-pulled-left">
        <span class="tag" v-if="qrcodes.length > 1">
          {{ $t("offline.client.text.qrcodesStatus", { index: selectedQr + 1, total: qrcodes.length }) }}
        </span>
      </div>
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
import {
  combineSpendBundleSignature,
  MessagesToSign,
  signMessages,
  signSpendBundle,
  SpendBundle,
} from "../../../../lib-chia/services/spendbundle";
import { decodeOffer, encodeOffer } from "../../../../lib-chia/services/offer/encoding";
import { networkContext, xchPrefix } from "@/store/modules/network";
import { AccountEntity } from "../../../../lib-chia/models/account";
import { getAssetsRequestDetail } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";
import { encode, decode } from "@msgpack/msgpack";
import utility from "../../../../lib-chia/services/crypto/utility";
import { prefix0x } from "../../../../lib-chia/services/coin/condition";

export interface CompactMessagesToSign {
  messages: CompactMessageToSign[];
  chainId: Uint8Array;
}

export interface CompactMessageToSign {
  message: Uint8Array;
  coinname: Uint8Array;
  publicKey: Uint8Array;
}

const MTSPrefix = "MTS";

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
  @Prop() public messagesToSign!: MessagesToSign | undefined;
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
  isUnsafe = false;
  safeQrcodes: string[] = [];
  unsafeQrcodes: string[] = [];

  get path(): string {
    return this.$route.path;
  }

  @Watch("bundle")
  async onBundleChange(): Promise<void> {
    this.safeQrcodes = this.bundle ? await this.splitBundle(this.bundle) : [];
    this.unsafeQrcodes = this.messagesToSign ? await this.splitMessagesToSign(this.messagesToSign) : [];

    this.isUnsafe = this.unsafeQrcodes.length > 0 && this.safeQrcodes.length > 5;
    this.onIsUnsafeChange();
  }

  @Watch("isUnsafe")
  async onIsUnsafeChange(): Promise<void> {
    if (this.isUnsafe) {
      this.qrcodes = this.unsafeQrcodes;
    } else {
      this.qrcodes = this.safeQrcodes;
    }
  }

  @Watch("path")
  onPathChange(): void {
    if (this.mode == "OFFLINE_CLIENT") this.close();
  }

  async splitBundle(bundle: SpendBundle): Promise<string[]> {
    const bstr = await encodeOffer(bundle, 4, "bundle");
    return this.splitString(bstr);
  }

  splitString(bstr: string, maxLength = 200): string[] {
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

  async splitMessagesToSign(mts: MessagesToSign): Promise<string[]> {
    const compact: CompactMessagesToSign = {
      chainId: utility.fromHexString(mts.chainId),
      messages: mts.messages.map((_) => ({
        message: utility.fromHexString(_.message),
        publicKey: utility.fromHexString(_.publicKey),
        coinname: utility.fromHexString(_.coinname),
      })),
    };
    const encoded = encode(compact);
    const bstr = MTSPrefix + Buffer.from(encoded).toString("base64");
    return this.splitString(bstr);
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
          if (this.isUnsafe && this.bundle) {
            const bundle = await combineSpendBundleSignature(this.bundle, prefix0x(result));
            this.$emit("signature", bundle.aggregated_signature);
          } else {
            this.$emit("signature", result);
          }
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

          await this.processCombinedMessageFromOnlineClient(b);
        }
      }
    } catch (err) {
      console.warn("error when decoding", err);
    }
  }

  async processCombinedMessageFromOnlineClient(b: string): Promise<void> {
    const requests = await getAssetsRequestDetail(this.account);
    if (b.startsWith(MTSPrefix)) {
      const arr = new Uint8Array(Buffer.from(b.slice(MTSPrefix.length), "base64"));
      const decoded = decode(arr) as CompactMessagesToSign;
      const msgs: MessagesToSign = {
        chainId: utility.toHexString(decoded.chainId),
        messages: decoded.messages.map((_) => ({
          message: utility.toHexString(_.message),
          coinname: utility.toHexString(_.coinname),
          publicKey: utility.toHexString(_.publicKey),
        })),
      };
      const sig = await signMessages(msgs, requests);
      this.qrcodes = [sig];
    } else {
      this.receiveBundle = await decodeOffer(b);
      const bundle = await signSpendBundle(this.receiveBundle, requests, networkContext());
      this.qrcodes = [bundle.aggregated_signature];
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
