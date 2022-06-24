<template>
  <ul class="list-group px-2" @updateOrder="updateOrder($event.detail)">
    <li class="list-item" v-for="asset of catList" :key="asset.id">
      <div class="panel-block">
        <b-tooltip :label="$t('ManageCats.ui.tooltip.drag')">
          <b-button class="drag-handle" type="is-text"><b-icon icon="format-line-spacing" size="is-small"></b-icon></b-button>
        </b-tooltip>
        <div class="column is-1">
          <span class="image is-32x32">
            <img v-if="asset.img" class="is-rounded" :src="asset.img" />
            <img v-else class="is-rounded" src="@/assets/custom-cat.svg" />
          </span>
        </div>
        <div class="column is-3">{{ asset.name | nameOmit(true) }}</div>
        <div class="column is-6">
          <b-tooltip :label="asset.id" multilined style="word-break: break-all">
            <div>{{ asset.id | shorten }}</div>
          </b-tooltip>
          <key-box icon="checkbox-multiple-blank-outline" :value="asset.id" :tooltip="$t('ManageCats.ui.tooltip.copy')"></key-box>
        </div>
        <div class="column is-3">
          <b-tooltip :label="$t('ManageCats.ui.tooltip.removeToken')">
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
