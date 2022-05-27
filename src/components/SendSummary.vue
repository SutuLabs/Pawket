<template>
  <div>
    <b-field>
      <template #label>
        <span class="is-size-6">{{ leadingText || $t("sendSummary.ui.label.sending") }}</span>
        <span class="is-pulled-right">
          <span v-if="unit == xchSymbol">
            {{ amount | demojo }}
          </span>
          <span v-else>
            {{ amount | demojo({ unit: unit, decimal: 3 }) }}
          </span>
        </span>
      </template>
    </b-field>
    <b-field v-if="assetId">
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.assetId") }}</span>
        <span class="is-size-6 is-pulled-right">
          <b-tooltip :label="assetId" multilined class="break-string" position="is-left">
            {{ assetId | shorten }}
          </b-tooltip>
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
export default class SendSummary extends Vue {
  @Prop() private leadingText!: string;
  @Prop() private contactName!: bigint;
  @Prop() private amount!: number;
  @Prop() private fee!: bigint;
  @Prop() private unit!: string;
  @Prop() private address!: string;
  @Prop() private assetId!: string;
  @Prop() private total!: bigint;

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
