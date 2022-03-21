<template>
  <div>
    <b-field label="Offer" message="e.g. offer1...">
      <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
    </b-field>
    <b-field v-if="summary" label="Information">
      <template #message>
        <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
          <li>{{sumkey}}</li>
          <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
            <b-taglist attached>
              <b-tag v-if="ent.id" type="is-info" :title="ent.id">CAT {{ ent.id.slice(0, 7) + "..." }}</b-tag>
              <b-tag v-else type="is-info">XCH</b-tag>

              <b-tag type="">{{ ent.amount }}</b-tag>
              <b-tag type="is-info is-light" :title="ent.target">{{ ent.target.slice(0, 7) + "..." }}</b-tag>
            </b-taglist>
          </li>
        </ul>
      </template>
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
import { getOfferSummary, OfferSummary } from "@/services/offer/summary";
import { decodeOffer } from "@/services/offer/encoding";

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
  public summary: OfferSummary | null = null;

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
    this.bundle = await decodeOffer(this.offerText);
    this.summary = null;
    this.summary = await getOfferSummary(this.bundle);
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
