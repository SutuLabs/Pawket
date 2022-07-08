<template>
  <div class="column is-8 is-offset-2 box">
    <p class="is-hidden-tablet has-text-centered is-size-5 pb-2 pr-2 border-bottom">{{ $t("trade.title") }}</p>
    <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">{{ $t("trade.title") }}</p>
    <div style="height: 70vh">
      <div class="has-text-centered is-block">
        <p class="is-size-4 has-text-grey pt-6 mt-6">Coming Soon</p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Settings extends Vue {}
</script>
<style scoped lang="scss">
.border-bottom {
  border-bottom: 2px solid #ededed;
}
.vertical-center {
  position: absolute;
  top: 30%;
  margin: auto;
  width: 100%;
}

.trade-container {
  max-width: 900px;
  margin: auto;
}
</style>
