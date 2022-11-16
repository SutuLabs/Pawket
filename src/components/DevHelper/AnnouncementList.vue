<template>
  <div>
    <h3 v-if="annoCreates.length > 0">{{ title }}</h3>
    <ul v-if="annoCreates.length > 0" class="args_list ellipsis-item">
      <li v-for="(anno, i) in annoCreates" :key="i" :title="anno.message">
        <b-button tag="a" size="is-small" @click="changeCoin(anno.coinIndex)">
          {{ anno.coinIndex }}
        </b-button>

        <span v-for="(asserted, idx) in [annoAsserted.filter((_) => _.message == anno.message)[0]]" :key="idx">
          <b-tag v-if="asserted" type="is-success is-light">AS</b-tag>
          <b-button v-if="asserted" tag="a" size="is-small" @click="changeCoin(asserted.coinIndex)">
            {{ asserted.coinIndex }}
          </b-button>
        </span>
        <b-tag v-if="annoAsserted.findIndex((_) => _.message == anno.message) == -1" type="is-warning is-light">No Assert</b-tag>

        <span class="mid-message">
          {{ anno.message }}
        </span>
      </li>
    </ul>
    <ul v-if="annoAsserted.length > 0" class="args_list ellipsis-item">
      <li
        v-for="(anno, i) in annoAsserted.filter((_) => !annoCreates.some((p) => p.message == _.message))"
        :key="i"
        :title="anno.message"
      >
        <b-button tag="a" size="is-small" @click="changeCoin(anno.coinIndex)">
          {{ anno.coinIndex }}
        </b-button>

        <b-tag type="is-warning is-light">Not Created</b-tag>

        <span class="mid-message is-danger">
          {{ anno.message }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { AnnouncementCoin } from "@/services/spendbundle";

@Component({
  components: {
    KeyBox,
  },
})
export default class AnnouncementList extends Vue {
  @Prop() public annoCreates!: AnnouncementCoin[];
  @Prop() public annoAsserted!: AnnouncementCoin[];
  @Prop() public title!: string;

  changeCoin(id: number): void {
    this.$emit("changeCoin", id);
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";

ul.args_list.ellipsis-item > li .mid-message {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
}
</style>
