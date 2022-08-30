<template>
  <div class="column nav-box mb-6 box">
    <router-view></router-view>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({})
export default class Explore extends Vue {}
</script>
<style scoped lang="scss">
.nav-box {
  max-width: 1000px;
  margin: auto;
}
</style>
