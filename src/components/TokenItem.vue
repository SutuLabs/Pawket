<template>
  <ul class="list-group px-2" @updateOrder="updateOrder($event.detail)">
    <li class="panel-block" v-for="asset of catList" :key="asset.id">
      <b-tooltip :label="$t('addToken.ui.tooltip.drag')">
        <b-button class="drag-handle" type="is-text"><b-icon icon="format-line-spacing" size="is-small"></b-icon></b-button>
      </b-tooltip>
      <div class="column is-3">{{ asset.name | nameOmit }}</div>
      <div class="column is-6">
        <b-tooltip :label="asset.id" multilined style="word-break: break-all">
          <div>{{ asset.id | shorten }}</div>
        </b-tooltip>
        <key-box icon="checkbox-multiple-blank-outline" :value="asset.id" :tooltip="$t('addToken.ui.tooltip.copy')"></key-box>
      </div>
      <div class="column is-3">
        <b-tooltip :label="$t('addToken.ui.tooltip.removeToken')">
          <b-button @click="remove(asset.id)" type="is-text"><b-icon icon="trash-can-outline" size="is-small"></b-icon></b-button>
        </b-tooltip>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { shorten } from "@/filters/addressConversion";
import { CustomCat } from "@/store/modules/account";
import { nameOmit } from "@/filters/nameConversion";
import KeyBox from "@/components/KeyBox.vue";

@Component({
  components: {
    KeyBox,
  },
  filters: { shorten, nameOmit },
})
export default class TokenItem extends Vue {
  @Prop() private catList!: CustomCat[];

  remove(id: string): void {
    this.$emit("remove", id);
  }

  updateOrder(newOrder: CustomCat[]): void {
    this.$emit("updateOrder", newOrder);
  }
}
</script>

<style scoped lang="scss"></style>
