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

          <b-field :label="$t('offline.client.scan.denseField')">
            <b-slider v-model="dense" :min="150" :max="1000" aria-label="Dense" :tooltip="false" @change="updateAndRefresh()">
              <template v-for="val in [150, 300, 500, 800, 1000]">
                <b-slider-tick :value="val" :key="val">{{ val }}</b-slider-tick>
              </template>
            </b-slider>
          </b-field>

          <b-field v-if="unsafeQrcodes.length > 0">
            <b-switch v-model="isUnsafe" type="is-info">
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
  getMessagesToSign,
  MessagesToSign,
  signMessages,
  signMessagesWithKeys,
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
import { Hex, Hex0x, prefix0x } from "../../../../lib-chia/services/coin/condition";
import { NotificationProgrammatic as Notification } from "buefy";
import pako from "pako";
import base85 from "base85";
import { EMPTY_SIGNATURE } from "../../../../lib-chia/services/coin/consts";
import { notifyDanger } from "@/services/notification/notification";
import { bech32m } from "@scure/base";

export interface CompactMessagesToSign {
  messages: CompactMessageToSign[];
  chainId: Uint8Array;
}

export interface CompactMessageToSign {
  message: Uint8Array;
  coinname: Uint8Array;
  publicKey: Uint8Array;
}

export enum CompactMessageType {
  SpendBundle = 0,
  MessagesOnly = 1,
}

export interface CompactMessagesV3 {
  mode: CompactMessageType;
  aggregatePublicKey?: Uint8Array;
  bundle?: Uint8Array;
  messages?: CompactMessageToSign[];
  chainId: Uint8Array;
}

const MTSPrefix = "MTS";
const MTSPrefixV2 = "MT2";
const MTSPrefixV3 = "MT3";

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
  @Prop() public aggregatePublicKey!: Hex0x;
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
  dense = 300;

  get path(): string {
    return this.$route.path;
  }

  async updateQrs(): Promise<void> {
    if (this.aggregatePublicKey) {
      this.safeQrcodes = this.bundle
        ? await this.splitBundleToSignV3(this.bundle, this.aggregatePublicKey, networkContext().chainId)
        : [];
      this.unsafeQrcodes = this.messagesToSign
        ? await this.splitMessagesToSignV3(this.messagesToSign, this.aggregatePublicKey)
        : [];
    } else {
      this.safeQrcodes = this.bundle ? await this.splitBundle(this.bundle) : [];
      this.unsafeQrcodes = this.messagesToSign ? await this.splitMessagesToSign(this.messagesToSign) : [];
    }
  }

  @Watch("bundle")
  async onBundleChange(): Promise<void> {
    this.updateAndRefresh(true);
  }

  async updateAndRefresh(changeDefault = false): Promise<void> {
    await this.updateQrs();

    if (changeDefault) this.isUnsafe = this.unsafeQrcodes.length > 0 && this.safeQrcodes.length > 5;
    await this.onIsUnsafeChange();
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

  splitString(bstr: string, maxLength = this.dense): string[] {
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

  /*
    example compression ratio:
    - scenario: send to 1 address with 100 coins
    - for spendbundle: 17181
    - for sign-only(unsafe mode/trust mode)
      - origin: 14655
      - pako: 7010
      - encoding:
        - base64: 9351
        - base85: 8770
  */
  async splitMessagesToSign(mts: MessagesToSign): Promise<string[]> {
    const compact: CompactMessagesToSign = {
      chainId: utility.fromHexString(mts.chainId),
      messages: mts.messages.map((_) => ({
        message: utility.fromHexString(_.message),
        publicKey: utility.fromHexString(_.publicKey),
        coinname: utility.fromHexString(_.coinname),
      })),
    };
    const origin = encode(compact);
    const encoded = pako.deflate(origin, { level: 9 });
    const bstr = MTSPrefixV2 + base85.encode(Buffer.from(encoded), "ascii85");
    return this.splitString(bstr);
  }

  async splitMessagesToSignV3(mts: MessagesToSign, aggpk: Hex0x | undefined): Promise<string[]> {
    const compact: CompactMessagesV3 = {
      mode: CompactMessageType.MessagesOnly,
      chainId: utility.fromHexString(mts.chainId),
      aggregatePublicKey: utility.fromHexString(aggpk),
      messages: mts.messages.map((_) => ({
        message: utility.fromHexString(_.message),
        publicKey: utility.fromHexString(_.publicKey),
        coinname: utility.fromHexString(_.coinname),
      })),
    };
    const origin = encode(compact);
    const encoded = pako.deflate(origin, { level: 9 });
    const bstr = MTSPrefixV3 + base85.encode(Buffer.from(encoded), "ascii85");
    return this.splitString(bstr);
  }

  async splitBundleToSignV3(bundle: SpendBundle, aggpk: Hex0x | undefined, chainId: Hex): Promise<string[]> {
    const bundle_str = await encodeOffer(bundle, 4, "bundle");
    const bundle_buff = bech32m.decodeToBytes(bundle_str).bytes;
    const compact: CompactMessagesV3 = {
      mode: CompactMessageType.SpendBundle,
      chainId: utility.fromHexString(chainId),
      aggregatePublicKey: utility.fromHexString(aggpk),
      bundle: bundle_buff,
    };

    const origin = encode(compact);
    const encoded = pako.deflate(origin, { level: 9 });
    const bstr = MTSPrefixV3 + base85.encode(Buffer.from(encoded), "ascii85");
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
          throw new Error("decoding wrong qr");
        }
        this.receiveTotal = total;
        this.receives[index] = result.slice(4);
        this.received = Object.keys(this.receives).length;

        if (this.received == this.receiveTotal) {
          this.cameraStatus = "off";
          let b = "";
          for (let i = 0; i < this.receiveTotal; i++) {
            const r = this.receives[i];
            if (!r) {
              console.warn("failed to join result", result);
              throw new Error("failed to join result");
            }

            b += r;
          }

          await this.processCombinedMessageFromOnlineClient(b);
        }
      }
    } catch (err) {
      console.warn("error when decoding", err);
      Notification.open({
        message: this.$tc("offline.client.scan.ui.message.generalDecodingError", undefined, { error: err }),
        type: "is-danger",
      });
    }
  }

  async processCombinedMessageFromOnlineClient(b: string): Promise<void> {
    const requests = await getAssetsRequestDetail(this.account);
    if (b.startsWith(MTSPrefix)) {
      // obsolete this branch after several versions --2024-02-16
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
      if (!this.checkSignature(sig)) return;
      this.qrcodes = [sig];
    } else if (b.startsWith(MTSPrefixV2)) {
      const buff = base85.decode(b.slice(MTSPrefixV2.length), "ascii85");
      if (!buff) throw new Error("cannot decode as base85");

      const decoded = decode(pako.inflate(new Uint8Array(buff))) as CompactMessagesToSign;
      const msgs: MessagesToSign = {
        chainId: utility.toHexString(decoded.chainId),
        messages: decoded.messages.map((_) => ({
          message: utility.toHexString(_.message),
          coinname: utility.toHexString(_.coinname),
          publicKey: utility.toHexString(_.publicKey),
        })),
      };
      const sig = await signMessages(msgs, requests);
      if (!this.checkSignature(sig)) return;
      this.qrcodes = [sig];
    } else if (b.startsWith(MTSPrefixV3)) {
      const buff = base85.decode(b.slice(MTSPrefixV3.length), "ascii85");
      if (!buff) throw new Error("cannot decode as base85");
      const decoded = decode(pako.inflate(new Uint8Array(buff))) as CompactMessagesV3;
      const chainId = utility.toHexString(decoded.chainId);
      const aggpk = decoded.aggregatePublicKey ? prefix0x(utility.toHexString(decoded.aggregatePublicKey)) : undefined;
      const sk: Hex0x | undefined = this.account.key.privateKey ? prefix0x(this.account.key.privateKey) : undefined;

      if (decoded.mode == CompactMessageType.SpendBundle) {
        const buff = decoded.bundle;
        if (!buff) {
          notifyDanger(this.$tc("offline.client.scan.ui.message.decodedBundleEmpty"));
          return;
        }

        const encoded = bech32m.encode("bundle", bech32m.toWords(buff), false);
        const receiveBundle = await decodeOffer(encoded);
        const msgs = await getMessagesToSign(receiveBundle, requests, chainId, false, true);
        const sig = await signMessagesWithKeys(msgs, requests, aggpk, sk, false);
        if (!this.checkSignature(sig)) return;
        this.qrcodes = [sig];
      } else if (decoded.mode == CompactMessageType.MessagesOnly) {
        if (!decoded.messages) {
          notifyDanger(this.$tc("offline.client.scan.ui.message.decodedMessagesEmpty"));
          return;
        }
        const msgs: MessagesToSign = {
          chainId,
          messages: decoded.messages.map((_) => ({
            message: utility.toHexString(_.message),
            coinname: utility.toHexString(_.coinname),
            publicKey: utility.toHexString(_.publicKey),
          })),
        };
        const sig = await signMessagesWithKeys(msgs, requests, aggpk, sk, false);
        if (!this.checkSignature(sig)) return;
        this.qrcodes = [sig];
      } else {
        notifyDanger(this.$tc("offline.client.scan.ui.message.unknownDecodedMessagesType"));
        return;
      }
    } else if (b.startsWith("bundle1")) {
      this.receiveBundle = await decodeOffer(b);
      const bundle = await signSpendBundle(this.receiveBundle, requests, networkContext());
      if (!this.checkSignature(bundle.aggregated_signature)) return;
      this.qrcodes = [bundle.aggregated_signature];
    } else {
      throw new Error(`Unknown message, leading string: ${b.substring(0, 50)}...`);
    }
  }

  async onInit(promise: Promise<void>): Promise<void> {
    promise.then(() => (this.cameraInited = true));
    await initCameraHandleError(promise, async (err) => {
      this.error = err;
    });
  }

  checkSignature(sig: string | undefined): boolean {
    if (!sig || sig == EMPTY_SIGNATURE) {
      notifyDanger(this.$tc("offline.client.scan.ui.message.emptySignature"));
      console.warn("empty signature");
      return false;
    }
    return true;
  }
}
</script>

<style scoped lang="scss"></style>
