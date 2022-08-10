<template>
  <div>
    <b-field>
      <template #label>
        <span class="is-size-6">Domain</span>
        <span class="is-pulled-right">
          {{ domainName }}
        </span>
      </template>
    </b-field>
    <b-field>
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.to") }}</span>
        <span class="is-size-6 is-pulled-right">
          <span v-if="contactName" class="tag is-primary is-light">{{ contactName }}</span>
          <b-tooltip :label="address" multilined class="break-string" position="is-left">
            {{ address | shorten }}
          </b-tooltip>
        </span>
      </template>
    </b-field>
    <b-field>
      <template #label>
        <span class="is-size-6">Price</span>
        <span class="is-pulled-right">
          10.00 XCH
        </span>
      </template>
    </b-field>
    <b-field>
      <template #label>
        <span class="is-size-6 has-text-grey">{{ $t("sendSummary.ui.label.fee") }}</span>
        <span class="is-size-6 is-pulled-right has-text-grey">
          {{ fee | demojo }}
        </span>
      </template>
    </b-field>
    <b-field v-if="total" class="py-4">
      <template #label>
        <span class="is-size-5">{{ $t("sendSummary.ui.label.total") }}</span>
        <span class="is-pulled-right is-size-5 has-text-primary">
          <span>
            {{ total | demojo }}
          </span>
        </span>
      </template>
    </b-field>
    <b-field v-else class="py-4">
      <template #label>
        <span class="is-size-5">{{ $t("sendSummary.ui.label.total") }}</span>
        <span class="is-pulled-right is-size-5 has-text-primary">
          <span v-if="unit == xchSymbol">
            {{ (amount + fee) | demojo }}
          </span>
          <span v-else>
            {{ amount | demojo({ unit: unit, decimal: 3 }) }}
            <span v-if="fee > 0"> + {{ fee | demojo }} </span>
          </span>
        </span>
      </template>
    </b-field>
  </div>
</template>
<script lang="ts">
import { shorten } from "@/filters/addressConversion";
import { demojo } from "@/filters/unitConversion";
import { xchSymbol } from "@/store/modules/network";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  filters: { demojo, shorten },
})
export default class buyCnsSummary extends Vue {
  @Prop() private leadingText!: string;
  @Prop() private contactName!: string;
  @Prop() public domainName!: string;
  @Prop() private amount!: number;
  @Prop() private fee!: bigint;
  @Prop() private unit!: string;
  @Prop() private address!: string;
  @Prop() private assetId!: string;
  @Prop() private total!: bigint;
  @Prop() private nftUri!: string;
  @Prop() private nftHash!: string;

  get xchSymbol(): string {
    return xchSymbol();
  }
}
</script>

<style scoped lang="scss">
.break-string {
  word-break: break-word;
}
</style>
