<template>
  <div>
    <b-field label="Offer" message="e.g. offer1...">
      <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
    </b-field>
    <template v-if="bundle">
      <bundle-panel :inputBundleText="bundleText"></bundle-panel>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from '@/models/wallet';
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import offer from '../../services/transfer/offer';

@Component({
  components: {
    KeyBox,
    BundlePanel,
  },
})
export default class OfferPanel extends Vue {

  @Prop() private inputOfferText!: string;
  public offerText = "";
  public bundle: SpendBundle | null = null;

  get bundleText(): string {
    return this.bundle == null ? "" : JSON.stringify(this.bundle);
  }

  mounted(): void {
    if (this.inputOfferText) {
      this.offerText = this.inputOfferText;
      this.updateOffer();
    }
    else {
      this.load();
    }
  }

  async updateOffer(): Promise<void> {
    this.bundle = null;
    this.bundle = await offer.decode(this.offerText);
    this.save();
  }

  save(): void {
    if (this.inputOfferText == this.offerText) return;
    localStorage.setItem("OFFER_DEBUG", this.offerText);
  }

  load(): void {
    const bd = localStorage.getItem("OFFER_DEBUG");
    if (bd) {
      this.offerText = bd;
      this.updateOffer();
    }
  }
}
</script>

<style scoped lang="scss">
</style>
