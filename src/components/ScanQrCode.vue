<template>
  <div class="modal-card">
    <section class="modal-card-body">
      <qrcode-stream v-if="cameraStatus != 'off'" :camera="cameraStatus" @decode="onDecode" @init="onInit" />
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from "vue-qrcode-reader";
import { decodeAddress, initCameraHandleError } from "@/services/view/camera";

@Component({
  components: {
    KeyBox,
    QrcodeStream,
    QrcodeDropZone,
    QrcodeCapture,
  },
})
export default class ScanQrCode extends Vue {
  @Prop({ default: "xch" }) public prefix!: string;
  public result = "";
  public error = "";
  public cameraStatus = "auto";

  @Emit("close")
  close(): void {
    this.cameraStatus = "off";
    return;
  }

  async onDecode(result: string): Promise<void> {
    this.result = decodeAddress(this.prefix, result) ?? this.result;

    if (this.result) {
      this.$emit("scanned", this.result);
      this.close();
    }
  }

  async onInit(promise: Promise<void>): Promise<void> {
    await initCameraHandleError(promise, async (err) => {
      this.error = err;
    });
  }
}
</script>

<style scoped lang="scss"></style>
