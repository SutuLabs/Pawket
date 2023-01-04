<template>
  <div class="modal-card">
    <top-bar :title="$t('scan.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-tabs position="is-center" expanded destroy-on-hide>
        <b-tab-item :label="$t('scan.ui.label.scanQr')" class="has-text-centered">
          <div class="camera-frame my-3">
            <qrcode-stream v-if="cameraStatus != 'off'" :camera="cameraStatus" @decode="onDecode" @init="onInit" />
          </div>
          <div class="has-text-grey is-size-6">{{ $t("scan.ui.hint.scan") }}</div>
        </b-tab-item>
        <b-tab-item :label="$t('scan.ui.label.publicKeyQr')" class="has-text-centered">
          <div class="my-3">
            <qrcode-vue :value="masterpubkey || account.key.publicKey" size="200" class="qrcode" style="width: 220px"></qrcode-vue>
          </div>
          <key-box :value="masterpubkey || account.key.publicKey" :showValue="true"></key-box>
        </b-tab-item>
      </b-tabs>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('offline.proxy.confirmBundle.button.cancel')" @click="close()"></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { AccountEntity, CustomCat } from "@/models/account";
import QrcodeVue from "qrcode.vue";
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from "vue-qrcode-reader";
import utility from "@/services/crypto/utility";
import { decodeAddress, initCameraHandleError } from "@/services/view/camera";
import { getAllCats } from "@/store/modules/account";
import { xchPrefix } from "@/store/modules/network";
import Send from "../Send/Send.vue";
import { isMobile } from "@/services/view/responsive";
import AddByPublicKey from "../AccountManagement/AddAccount/AddByPublicKey.vue";
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
export default class Scan extends Vue {
  @Prop() public account!: AccountEntity;
  public masterpubkey = "";
  public cameraStatus = "auto";
  public cameraInited = false;
  error = "";

  @Emit("close")
  close(): void {
    return;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  mounted(): void {
    var privkey = utility.fromHexString(this.account.key.privateKey);
    utility.getPrivateKey(privkey).then((sk) => {
      this.masterpubkey = utility.toHexString(sk.get_g1().serialize());
    });
  }

  async onDecode(result: string): Promise<void> {
    const address = decodeAddress(xchPrefix(), result);
    if (address != null) {
      this.send(address);
    } else {
      this.addByPublicKey(result);
    }
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }

  send(address: string): void {
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: {
        account: this.account,
        inputAddress: address,
      },
    });
  }

  async addByPublicKey(pubKey: string): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByPublicKey,
      hasModalCard: true,
      fullScreen: isMobile(),
      trapFocus: true,
      props: {
        inputPubKey: pubKey,
      },
      canCancel: [""],
    });
  }

  async onInit(promise: Promise<void>): Promise<void> {
    promise.then(() => (this.cameraInited = true));
    await initCameraHandleError(promise, async (err) => {
      this.error = err;
    });
  }
}
</script>

<style scoped lang="scss">
.camera-frame {
  margin: auto;
  aspect-ratio: 1;

  background: linear-gradient(to right, grey 4px, transparent 4px) 0 0,
    linear-gradient(to right, grey 4px, transparent 4px) 0 100%, linear-gradient(to left, grey 4px, transparent 4px) 100% 0,
    linear-gradient(to left, grey 4px, transparent 4px) 100% 100%, linear-gradient(to bottom, grey 4px, transparent 4px) 0 0,
    linear-gradient(to bottom, grey 4px, transparent 4px) 100% 0, linear-gradient(to top, grey 4px, transparent 4px) 0 100%,
    linear-gradient(to top, grey 4px, transparent 4px) 100% 100%;

  background-repeat: no-repeat;
  background-size: 20px 20px;
}
</style>
