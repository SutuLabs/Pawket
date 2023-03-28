<template>
  <div class="modal-card">
    <section class="modal-card-body">
      <center v-if="qrcode">
        <div v-if="qrcode.length * 8 < MAX_LENGTH">
          <qrcode-vue :value="qrcode" size="300" class="qrcode" style="width: 320px"></qrcode-vue>
          {{ $t("offline.client.show.hint") }}
        </div>
        <div v-else>
          {{ $t("offline.client.show.overflow") }}
        </div>
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
import KeyBox from "@/components/Common/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { SpendBundle } from "@/services/spendbundle";
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
  public MAX_LENGTH = 23648;

  async mounted(): Promise<void> {
    setTimeout(async () => {
      try {
        // console.log(this.bundle)
        this.qrcode = await encodeOffer(this.bundle, undefined, "bundle");
      } catch (err) {
        console.warn("failed to encode bundle", err);
        this.qrcode = "";
      }
    }, 1000);
  }
}
</script>

<style scoped lang="scss"></style>
