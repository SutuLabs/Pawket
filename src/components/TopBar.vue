<template>
  <div class="is-size-5 border-bottom modal-card-head py-4">
    <div class="is-hidden-tablet modal-card-title line-height-initial">
      <span @click="$emit('close')"
        ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon
      ></span>
      <span class="pr-2 is-inline-block text-ellipsis">{{ title }}</span>
      <b-tag type="is-info" v-if="tag">{{ tag }}</b-tag>
    </div>
    <div class="is-hidden-mobile modal-card-title">
      <span v-if="showBack" @click="$emit('close')"
        ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable" icon="chevron-left"> </b-icon
      ></span>
      <span v-if="showClose" @click="$emit('close')"
        ><b-icon class="is-pulled-right has-text-grey is-clickable hover-danger" icon="close"> </b-icon
      ></span>
      <span class="pl-4">{{ title }}</span>
      <b-tag type="is-info" class="ml-2" v-if="tag">{{ tag }}</b-tag>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class TopBar extends Vue {
  @Prop() title!: string;
  @Prop({ default: "" }) tag!: string;
  @Prop({ default: false }) showBack!: boolean;
  @Prop({ default: false }) showClose!: boolean;
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";
.hover-danger:hover {
  color: $danger !important;
}
.border-bottom {
  border-bottom: 2px solid #ededed;
  background-color: white;
}

.text-ellipsis {
  text-overflow: ellipsis;
  width: 80%;
  white-space: nowrap;
  overflow: hidden;
}

.line-height-initial {
  line-height: initial;
}
</style>
