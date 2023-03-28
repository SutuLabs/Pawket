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
      <div v-for="item of filteredData" :key="item.code" aria-role="listitem" class="has-background-white-ter">
        <div class="panel-block columns" v-if="isImported(item.hash)">
          <div class="column is-1 is-narrow-mobile">
            <b-checkbox :value="true" disabled> </b-checkbox>
          </div>
          <div class="column is-1 is-narrow-mobile">
            <span class="image is-32x32">
              <img class="is-rounded" :src="item.logo_url" />
            </span>
          </div>
          <div class="column is-2 is-narrow-mobile">
            {{ item.code }}
          </div>
          <div class="column is-offset-4 is-4">
            <b-tag rounded class="is-pulled-right has-background-grey-lighter">{{ $t("searchCat.ui.tag.imported") }} </b-tag>
          </div>
        </div>
        <div class="panel-block columns" v-else>
          <div class="column is-1 is-narrow-mobile">
            <b-checkbox v-model="checkedCat" :native-value="item"> </b-checkbox>
          </div>
          <div class="column is-1 is-narrow-mobile">
            <span class="image is-32x32">
              <img class="is-rounded" :src="item.logo_url" />
            </span>
          </div>
          <div class="column is-2 is-narrow-mobile">
            {{ item.code }}
          </div>
          <div class="column is-offset-4 is-4"></div>
        </div>
      </div>
      <div v-if="!filteredData.length" class="has-text-centered has-text-grey mb-2">
        {{ $t("searchCat.ui.text.emptyList") }}
      </div>
    </div>
    <div class="mt-5 pt-3">
      <div class="has-text-centered">
        <b-button
          :label="$t('ManageCats.ui.button.add')"
          type="is-primary"
          rounded
          outlined
          class="mx-2"
          :disabled="!checkedCat.length"
          @click="addCat()"
        ></b-button>
      </div>
      <p class="has-text-centered has-text-grey mt-2 mb-0 is-size-7">{{ $t("searchCat.ui.text.ascription") }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { CustomCat } from "@/models/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import TailDb, { TailInfo } from "@/services/api/tailDb";
import { unprefix0x } from "@/services/coin/condition";

@Component
export default class SearchCat extends Vue {
  @Prop({ default: [] }) public allCats!: CustomCat[];

  public searchInput = "";
  public checkedCat: TailInfo[] = [];
  public tails: TailInfo[] = [];

  get filteredData(): TailInfo[] {
    if (!this.searchInput.length) return this.tails;
    let res: TailInfo[] = [];
    const hash = unprefix0x(this.searchInput.toLowerCase());
    const code = this.searchInput.toUpperCase();
    this.tails.map((t) => {
      if (t.code.startsWith(code)) res.push(t);
      else if (t.hash == hash) res.push(t);
    });
    return res;
  }

  async addCat(): Promise<void> {
    this.$emit("addCats", this.checkedCat);
    this.checkedCat = [];
    return;
  }

  isImported(id: string): boolean {
    return this.allCats.findIndex((a) => a.id === id) > -1;
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
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
