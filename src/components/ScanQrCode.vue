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
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'

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
    const p = this.prefix + "1";
    const reg = new RegExp(p + ".*");
    const r = result.match(reg);
    if (!r || r.length != 1) return;
    const rr = r[0];

    if (rr.startsWith(p)) {
      this.result = rr;
    }

    this.$emit('scanned', this.result);
    this.close();
  }

  async onInit(promise: Promise<void>): Promise<void> {
    try {
      await promise;
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        this.error = "ERROR: you need to grant camera access permission"
      } else if (error.name === 'NotFoundError') {
        this.error = "ERROR: no camera on this device"
      } else if (error.name === 'NotSupportedError') {
        this.error = "ERROR: secure context required (HTTPS, localhost)"
      } else if (error.name === 'NotReadableError') {
        this.error = "ERROR: is the camera already in use?"
      } else if (error.name === 'OverconstrainedError') {
        this.error = "ERROR: installed cameras are not suitable"
      } else if (error.name === 'StreamApiNotSupportedError') {
        this.error = "ERROR: Stream API is not supported in this browser"
      } else if (error.name === 'InsecureContextError') {
        this.error = 'ERROR: Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.';
      } else {
        this.error = `ERROR: Camera error (${error.name})`;
      }
    }
  }
}
</script>

<style scoped lang="scss"></style>
