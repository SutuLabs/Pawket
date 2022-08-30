<template>
  <div>
    <b-field v-if="domainName">
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
            {{ shorten(address) }}
          </b-tooltip>
        </span>
      </template>
    </b-field>
    <b-field v-if="amount">
      <template #label>
        <span class="is-size-6">Price</span>
        <span class="is-pulled-right"> {{ amount }} XCH </span>
      </template>
    </b-field>
    <b-field>
      <template #label>
        <span class="is-size-6 has-text-grey">{{ $t("sendSummary.ui.label.fee") }}</span>
        <span class="is-size-6 is-pulled-right has-text-grey">
          {{ demojo(fee) }}
        </span>
      </template>
    </b-field>
    <b-field v-if="total" class="py-4">
      <template #label>
        <span class="is-size-5">{{ $t("sendSummary.ui.label.total") }}</span>
        <span class="is-pulled-right is-size-5 has-text-primary">
          <span>
            {{ demojo(total) }}
          </span>
        </span>
      </template>
    </b-field>
    <b-field v-else class="py-4">
      <template #label>
        <span class="is-size-5">{{ $t("sendSummary.ui.label.total") }}</span>
        <span class="is-pulled-right is-size-5 has-text-primary">
          <span v-if="unit == xchSymbol">
            {{ demojo(BigInt(amount) + fee) }}
          </span>
          <span v-else>
            {{ demojo(amount, { unit: unit, decimal: 3, symbol: "" }) }}
            <span v-if="fee > 0"> + {{ demojo(fee) }} </span>
          </span>
        </span>
      </template>
    </b-field>
  </div>
</template>
<script lang="ts">
import { shorten } from "@/filters/addressConversion";
import { demojo } from "@/filters/unitConversion";
import { OneTokenInfo } from "@/models/account";
import { xchSymbol } from "@/store/modules/network";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({})
export default class BuyCnsSummary extends Vue {
  @Prop() public leadingText!: string;
  @Prop() public contactName!: string;
  @Prop() public domainName!: string;
  @Prop() public amount!: number;
  @Prop() public fee!: bigint;
  @Prop() public unit!: string;
  @Prop() public address!: string;
  @Prop() public assetId!: string;
  @Prop() public total!: bigint;
  @Prop() public nftUri!: string;
  @Prop() public nftHash!: string;

  get xchSymbol(): string {
    return xchSymbol();
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  shorten(name: string): string {
    return shorten(name);
  }
}
</script>

<style scoped lang="scss">
.break-string {
  word-break: break-word;
}
</style>
