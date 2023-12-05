<template>
  <div>
    <b-modal v-model="isInspectorActive" has-modal-card>
      <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title">Inspect</p>
        </header>
        <section class="modal-card-body">
          <bundle-panel v-if="inspectorType == 'SpendBundle'" :inputBundleText="inspectSpendBundle"></bundle-panel>
          <offer-panel v-if="inspectorType == 'Offer'" :inputOfferText="inspectOffer"></offer-panel>
          <json-viewer v-if="inspectorType == 'Json'" :value="inspectJson" :expand-depth="5" copyable boxed sort></json-viewer>
        </section>
        <footer class="modal-card-foot">
          <b-button label="Close" @click="isInspectorActive = false" />
        </footer>
      </div>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import OfferPanel from "@/components/DevHelper/OfferPanel.vue";
import JsonViewer from "vue-json-viewer";

@Component({
  components: {
    KeyBox,
    BundlePanel,
    OfferPanel,
    JsonViewer,
  },
})
export default class Inspector extends Vue {
  public isInspectorActive = false;
  public inspectSpendBundle: string | null = null;
  public inspectOffer: unknown | null = null;
  public inspectJson: unknown | null = null;
  public inspectorType: "SpendBundle" | "Offer" | "Json" | "Unknown" = "Unknown";

  mounted(): void {
    //
  }

  inspect(value: unknown): void {
    const type = getOutputType(value);
    switch (type) {
      case "spendbundle":
        this.inspectSpendBundle = JSON.stringify(value);
        this.inspectorType = "SpendBundle";
        this.isInspectorActive = true;
        break;
      case "object":
        this.inspectJson = JSON.parse(JSON.stringify(value));
        this.inspectorType = "Json";
        this.isInspectorActive = true;
        break;

      case "offer":
        this.inspectOffer = value;
        this.inspectorType = "Offer";
        this.isInspectorActive = true;
        break;

      default:
        break;
    }
  }
}

export type LogType =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function"
  | "spendbundle"
  | "offer";

export function getOutputType(input: unknown): LogType {
  const type = typeof input;
  if (typeof input === "string" && input.startsWith("offer1")) return "offer";
  if (typeof input === "object" && input != null && "aggregated_signature" in input && "coin_spends" in input)
    return "spendbundle";
  return type;
}
</script>

<style scoped lang="scss"></style>
