<template>
  <ul class="list-group px-2" @updateOrder="updateOrder($event.detail)">
    <li class="list-item" v-for="asset of catList" :key="asset.id">
      <div class="panel-block">
        <b-tooltip :label="$t('ManageCats.ui.tooltip.drag')" size="is-small" position="is-right">
          <b-button class="drag-handle" type="is-text"><b-icon icon="format-line-spacing" size="is-small"></b-icon></b-button>
        </b-tooltip>
        <div class="column is-1">
          <span class="image is-32x32">
            <img v-if="asset.img" class="is-rounded" :src="asset.img" />
            <img v-else class="is-rounded" src="@/assets/custom-cat.svg" />
          </span>
        </div>
        <div class="column is-3">{{ nameOmit(asset.name, true) }}</div>
        <div class="column is-6">
          <b-tooltip :label="asset.id" multilined style="word-break: break-all" size="is-small" position="is-left">
            <div>{{ shorten(asset.id) }}</div>
          </b-tooltip>
          <key-box icon="checkbox-multiple-blank-outline" :value="asset.id" :tooltip="$t('ManageCats.ui.tooltip.copy')"></key-box>
        </div>
        <div class="column is-3">
          <b-tooltip :label="$t('ManageCats.ui.tooltip.removeToken')" size="is-small" position="is-left">
            <b-button @click="remove(asset.id)" type="is-text"
              ><b-icon icon="trash-can-outline" size="is-small"></b-icon
            ></b-button>
          </b-tooltip>
        </div>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { shorten } from "@/filters/addressConversion";
import { CustomCat } from "@/models/account";
import { nameOmit } from "@/filters/nameConversion";
import KeyBox from "@/components/Common/KeyBox.vue";

@Component({
  components: {
    KeyBox,
  },
})
export default class TokenItem extends Vue {
  @Prop() public catList!: CustomCat[];

  remove(id: string): void {
    this.$emit("remove", id);
  }

  updateOrder(detail: { oldIndex: number; newIndex: number }): void {
    this.$emit("updateOrder", detail);
  }

  nameOmit(name: string, upperCase = false): string {
    return nameOmit(name, upperCase);
  }

  shorten(name: string): string {
    return shorten(name);
  }
}
</script>

<style scoped lang="scss"></style>
