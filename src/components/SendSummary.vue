<template>
  <div>
    <b-field>
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.sending") }}</span>
        <span class="is-pulled-right">
          <span v-if="unit == 'XCH'">
            {{ amount | demojo }}
          </span>
          <span v-else>
            {{ amount | demojo({ unit: unit, decimal: 3 }) }}
          </span>
        </span>
      </template>
    </b-field>
    <b-field>
      <template #label>
        <span class="is-size-6">{{ $t("sendSummary.ui.label.to") }}</span>
        <span class="is-size-6 is-pulled-right">
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
    <b-field class="py-4">
      <template #label>
        <span class="is-size-5">{{ $t("sendSummary.ui.label.total") }}</span>
        <span class="is-pulled-right is-size-5 has-text-primary">
          <span v-if="unit == 'XCH'">
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
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  filters: { demojo, shorten },
})
export default class SendSummary extends Vue {
  @Prop() private amount!: number;
  @Prop() private fee!: bigint;
  @Prop() private unit!: string;
  @Prop() private address!: string;
}
</script>

<style scoped lang="scss">
.break-string {
  word-break: break-word;
}
</style>
