<template>
  <div>
    <b-field label="Offer" message="e.g. offer1...">
      <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
    </b-field>
    <b-field v-if="summary" label="Information">
      <template #message>
        <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
          <li>{{ sumkey }}</li>
          <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
            <b-taglist attached>
              <b-tag v-if="ent.cat_target" type="is-info" :title="ent.id">CAT {{ ent.id.slice(0, 7) + "..." }}</b-tag>
              <b-tag v-else-if="ent.nft_target" type="is-info" :title="getNftName(ent.id)">{{
                getNftName(ent.id).slice(0, 20) + "..."
              }}</b-tag>
              <b-tag v-else type="is-info">{{ xchSymbol }}</b-tag>

              <b-tag type="" v-if="ent.nft_target">{{ ent.royalty / 100 }}%</b-tag>
              <b-tag type="" v-else>{{ ent.amount }}</b-tag>
              <b-tag type="is-info is-light" :title="ent.target">{{ getAddress(ent.target).slice(0, 7) + "..." }}</b-tag>
              <b-tag type="is-info is-light" v-if="ent.nft_uri">
                <a :href="ent.nft_uri" target="_blank">
                  <b-tooltip :label="ent.nft_uri" multilined class="break-string" position="is-left">
                    <img :src="ent.nft_uri" class="nft-image" />
                  </b-tooltip>
                </a>
              </b-tag>
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
import KeyBox from "@/components/Common/KeyBox.vue";
import { SpendBundle } from "@/services/spendbundle";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import { getOfferSummary, OfferSummary } from "@/services/offer/summary";
import { decodeOffer } from "@/services/offer/encoding";
import { xchPrefix, xchSymbol } from "@/store/modules/network";
import puzzle from "@/services/crypto/puzzle";

@Component({
  components: {
    KeyBox,
    BundlePanel,
  },
})
export default class OfferPanel extends Vue {
  @Prop() public inputOfferText!: string;
  public offerText = "";
  public bundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;

  get bundleText(): string {
    return this.bundle == null ? "" : JSON.stringify(this.bundle);
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  mounted(): void {
    if (this.inputOfferText) {
      this.offerText = this.inputOfferText;
      this.updateOffer();
    } else {
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

  getNftName(hex: string): string {
    return puzzle.getAddressFromPuzzleHash(hex, "nft");
  }

  getAddress(hex: string): string {
    return puzzle.getAddressFromPuzzleHash(hex, xchPrefix());
  }
}
</script>

<style scoped lang="scss">
img.nft-image {
  width: 100px;
  height: 1.5rem;
  object-fit: cover;
  border: 1px solid;
}
.break-string {
  word-break: break-word;
}
</style>
