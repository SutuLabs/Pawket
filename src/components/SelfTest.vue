<template>
  <div class="box" id="self-test">
    <div v-if="status == 'Checking'">⌛{{ $t("self-test.message.checking") }}</div>
    <div v-else-if="status == 'Passed'">
      <template v-if="showPassed">✅{{ $t("self-test.message.passed") }}</template>
    </div>
    <div v-else>❌{{ $t("self-test.message.failed") + errorMessage }}</div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { SelfTestStatus } from "@/store/modules/app";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class SelfTest extends Vue {
  public get status(): SelfTestStatus {
    return store.state.app.selfTestStatus;
  }
  public get errorMessage(): string {
    return store.state.app.selfTestError;
  }
  public showPassed = false;
}
</script>

<style scoped lang="scss">
#self-test {
  display: table-row;
}
</style>
