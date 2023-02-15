<template>
  <div>
    <b-field v-if="nftUri">
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.NftUri") }}</span>
        <span class="is-pulled-right">
          <a :href="nftUri" target="_blank">
            <b-tooltip :label="nftUri" multilined class="break-string" position="is-left">
              <img :src="nftUri" class="nft-image" />
            </b-tooltip>
          </a>
        </span>
      </template>
    </b-field>
    <b-field v-if="!nftUri">
      <template #label>
        <span class="is-size-6">{{ leadingText || $t("sendSummary.ui.label.sending") }}</span>
        <span class="is-pulled-right">
          <span v-if="unit == xchSymbol">
            {{ demojo(amount) }}
          </span>
          <span v-else>
            {{ demojo(amount, { unit: unit, decimal: 3, symbol: "" }) }}
          </span>
        </span>
      </template>
    </b-field>
    <b-field v-if="assetId">
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.assetId") }}</span>
        <span class="is-size-6 is-pulled-right">
          <b-tooltip :label="assetId" multilined class="break-string" position="is-left">
            {{ assetId }}
          </b-tooltip>
        </span>
      </template>
    </b-field>
    <b-field v-if="address">
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.to") }}</span>
        <span class="is-size-6 is-pulled-right">
          <span v-if="contactName" class="tag is-primary is-light">{{ contactName }}</span>
          <b-tooltip :label="address" multilined class="break-string" position="is-left">
            {{ address }}
          </b-tooltip>
        </span>
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
    <div v-if="!nftUri">
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
  </div>
</template>
<script lang="ts">
import { shorten } from "@/filters/addressConversion";
import { demojo } from "@/filters/unitConversion";
import { OneTokenInfo } from "@/models/account";
import { xchSymbol } from "@/store/modules/network";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({})
export default class SendSummary extends Vue {
  @Prop() public leadingText!: string;
  @Prop() public contactName!: string;
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

  BigInt(n: string | number | bigint | boolean): bigint {
    return BigInt(n);
  }
}
</script>

<style scoped lang="scss">
.break-string {
  word-break: break-word;
}
img.nft-image {
  width: 100px;
  height: 1.5rem;
  object-fit: cover;
  border: 1px solid;
}
</style>
