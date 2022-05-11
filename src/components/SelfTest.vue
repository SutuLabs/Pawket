<template>
  <div class="box" id="self-test">
    <div v-if="status == 'Checking'">⌛{{ $t("self-test.message.checking") }}</div>
    <div v-else-if="status == 'Passed'">
      <template v-if="showPassed">✅{{ $t("self-test.message.passed") }}</template>
    </div>
    <div v-else>❌{{ $t("self-test.message.failed") + errorMessage }}</div>
    <div v-if="debugMode && isExpire">
      <a href="javascript:void(0)" @click="tempDisable()">Temporary Disable SelfTest</a>
    </div>
  </div>
</template>

<script lang="ts">
import runner from "@/services/selftest/runner";
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

  public get debugMode(): boolean {
    return store.state.app.debug;
  }

  public get isExpire(): boolean {
    const timestamp = runner.getExpireTime();
    return timestamp < Date.now();
  }

  tempDisable(): void {
    runner.setExpireTime();
  }
}
</script>

<style scoped lang="scss">
#self-test {
  display: table-row;
}
</style>
