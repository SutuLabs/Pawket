<template>
  <div class="trade-container">
    <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom">{{ $t("trade.title") }}</p>
    <p class="is-hidden-mobile has-text-left is-size-5 pt-5 pb-2 pl-2 border-bottom">{{ $t("trade.title") }}</p>
    <div style="height: 100vh">
      <div class="has-text-centered is-block">
        <p class="is-size-4 has-text-grey">暂未开放</p>
        <p class="is-size-4 has-text-grey">敬请期待</p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Settings extends Vue {}
</script>
<style lang="scss">
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
  max-width: 700px;
  margin: auto;
}
</style>
