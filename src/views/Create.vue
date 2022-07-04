<template>
  <div class="column is-6 is-offset-3">
    <div class="box is-hidden-mobile">
      <router-view></router-view>
    </div>
    <div class="is-hidden-tablet">
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Create extends Vue {}
</script>

<style scoped lang="scss"></style>
