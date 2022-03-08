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
        this.error = this.$tc('scanQrCode.message.error.NotAllowedError')
      } else if (error.name === 'NotFoundError') {
        this.error = this.$tc('scanQrCode.message.error.NotFoundError')
      } else if (error.name === 'NotSupportedError') {
        this.error = this.$tc('scanQrCode.message.error.NotSupportedError')
      } else if (error.name === 'NotReadableError') {
       this.error = this.$tc('scanQrCode.message.error.NotReadableError')
      } else if (error.name === 'OverconstrainedError') {
        this.error = this.$tc('scanQrCode.message.error.OverconstrainedError')
      } else if (error.name === 'StreamApiNotSupportedError') {
       this.error = this.$tc('scanQrCode.message.error.StreamApiNotSupportedError')
      } else if (error.name === 'InsecureContextError') {
       this.error = this.$tc('scanQrCode.message.error.InsecureContextError')
      } else {
        this.error = `ERROR: Camera error (${error.name})`;
      }
    }
  }
}
</script>

<style scoped lang="scss"></style>
