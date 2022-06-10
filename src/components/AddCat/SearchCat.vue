<template>
  <div>
    <b-field>
      <b-dropdown append-to-body scrollable max-height="200" trap-focus expanded :close-on-click="false">
        <template #trigger>
          <b-input :placeholder="$t('searchCat.ui.placeholder')" type="search" icon="magnify" v-model="searchInput"> </b-input>
        </template>
        <b-dropdown-item v-for="item of filteredData" :key="item.code" aria-role="listitem">
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
        </b-dropdown-item>
      </b-dropdown>
    </b-field>
    <b-field v-for="cat of checkedCat" :key="cat.code" aria-role="list">
      <b-tag rounded>{{ cat.code }}</b-tag>
    </b-field>
    <div class="has-text-centered">
      <b-button
        :label="$t('ManageCats.ui.button.add')"
        type="is-primary"
        rounded
        outlined
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

  async mounted(): Promise<void> {
    this.tails = await TailDb.getTails();
  }
}
</script>
