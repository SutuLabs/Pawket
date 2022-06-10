<template>
  <div>
    <b-field>
      <b-input
        :placeholder="$t('searchCat.ui.placeholder')"
        type="search"
        icon="magnify"
        v-model="searchInput"
        @input.native.enter="scrollTop"
      >
      </b-input>
    </b-field>
    <div class="tail-list" id="tail-list">
      <div v-for="item of filteredData" :key="item.code" aria-role="listitem">
        <div class="panel-block columns" v-if="isImported(item.code)">
          <div class="column is-2">
            <b-checkbox :value="true" disabled>
              {{ item.code }}
            </b-checkbox>
          </div>
          <div class="column is-offset-6 is-4">
            <b-tag rounded class="is-pulled-right">{{ $t("searchCat.ui.tag.imported") }}</b-tag>
          </div>
        </div>
        <div class="panel-block columns" v-else>
          <div class="column is-2">
            <b-checkbox v-model="checkedCat" :native-value="item">
              {{ item.code }}
            </b-checkbox>
          </div>
        </div>
      </div>
    </div>
    <div class="has-text-centered">
      <b-button
        :label="$t('ManageCats.ui.button.add')"
        type="is-primary"
        rounded
        outlined
        :aria-disabled="checkedCat.length"
        class="mx-2"
        @click="addCat()"
      ></b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { CustomCat } from "@/store/modules/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import TailDb, { TailStorage } from "../../services/api/tailDb";
@Component
export default class SearchCat extends Vue {
  @Prop({ default: [] }) private allCats!: CustomCat[];

  public searchInput = "";
  public checkedCat: TailStorage[] = [];
  private tails: TailStorage[] = [];

  get filteredData(): TailStorage[] {
    if (!this.searchInput.length) return this.tails;
    let res: TailStorage[] = [];
    this.tails.map((t) => {
      if (t.code.startsWith(this.searchInput.toUpperCase())) res.push(t);
    });
    return res;
  }

  async addCat(): Promise<void> {
    this.$emit("addCats", this.checkedCat);
    this.checkedCat = [];
    return;
  }

  isImported(symbol: string): boolean {
    return this.allCats.findIndex((a) => a.name.toUpperCase() === symbol) > -1;
  }

  scrollTop(): void {
    const tailList = document.getElementById("tail-list");
    if (tailList) tailList.scrollTop = 0;
  }

  async mounted(): Promise<void> {
    this.tails = await TailDb.getTails();
  }
}
</script>
<style scoped lang="scss">
.tail-list {
  max-height: 20vh;
  overflow-y: scroll;
}
</style>
