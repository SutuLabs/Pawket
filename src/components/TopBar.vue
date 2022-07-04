<template>
  <div class="is-size-5 pt-5 pb-2 pr-2 border-bottom">
    <div class="is-hidden-tablet has-text-centered">
      <span @click="$emit('close')"><b-icon class="is-pulled-left has-text-grey pl-4 pt-2" icon="chevron-left"> </b-icon></span>
      <span class="pr-5">{{ title }}</span>
    </div>
    <div class="is-hidden-mobile has-text-left">
      <span v-if="showBack" @click="$emit('close')"><b-icon class="is-pulled-left has-text-grey pt-2" icon="chevron-left"> </b-icon></span>
      <span class="pl-4">{{ title }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class TopBar extends Vue {
  @Prop() title!: string;
  @Prop({ default: false }) showBack!: boolean;
}
</script>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 2px solid #ededed;
  background-color: white;
}
</style>
