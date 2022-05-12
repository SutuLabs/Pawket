<template>
  <div class="modal-card">
    <section class="modal-card-body">
      <center>
        <qrcode-vue :value="qrcode" size="300"></qrcode-vue>
        {{ $t("offline.client.show.hint") }}
      </center>
      <b-field>
        <template #label>
          {{ $t("offline.client.show.bundle") }}
          <key-box icon="checkbox-multiple-blank-outline" :value="qrcode" :tooltip="$t('offline.client.show.copy')"></key-box>
        </template>
        <b-input type="textarea" disabled :value="qrcode"></b-input>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { SpendBundle } from "@/models/wallet";
import { encodeOffer } from "@/services/offer/encoding";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class OfflineSendShowBundle extends Vue {
  @Prop({ default: "bundle" }) public prefix!: string;
  @Prop() public bundle!: SpendBundle;

  public qrcode = "";

  async mounted(): Promise<void> {
    this.qrcode = await encodeOffer(this.bundle, "bundle");
  }
}
</script>

<style scoped lang="scss"></style>
