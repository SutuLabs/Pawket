<template>
  <div class="modal-card m-0">
    <header>
      <top-bar :title="$t('collection.myCollection.title')" @close="close()"></top-bar>
      <div class="has-text-grey is-size-6 pl-4">{{ $t("collection.myCollection.specialNote") }}</div>
    </header>
    <section class="modal-card-body">
      <div class="mb-3">
        <a class="button is-fullwidth is-primary is-outlined is-size-6" @click="createCollection()">
          <b-icon icon="plus" size="is-small" class="mr-1"></b-icon>
          {{ $t("collection.myCollection.button.newCollection") }}
        </a>
      </div>
      <div class="mt-4 list-box" v-if="collections.length">
        <a href="javascript:void(0)" class="panel-block columns is-mobile m-1" v-for="(col, index) of collections" :key="index">
          <div class="column is-flex is-10">
            <div class="mr-2">
              <b-icon icon="account-circle" size="is-medium" class="has-text-primary"></b-icon>
            </div>
            <div>
              <p class="has-text-grey-dark is-size-6">{{ col.name }}</p>
              <p>
                <span class="is-size-7 has-text-grey-light word-break">{{ col.description }}</span>
              </p>
            </div>
          </div>
          <div class="column is-flex is-1">
            <b-tooltip :label="$t('collection.myCollection.tooltip.edit')">
              <b-button type="is-text" @click="edit(index)"><b-icon icon="square-edit-outline"></b-icon></b-button>
            </b-tooltip>
            <b-tooltip :label="$t('collection.myCollection.tooltip.remove')">
              <b-button type="is-text" @click="remove(col.id)"><b-icon icon="trash-can-outline"></b-icon></b-button>
            </b-tooltip>
          </div>
        </a>
      </div>
      <div class="has-text-centered is-size-5" v-else>
        {{ $t("collection.myCollection.messages.information.NO_COLLECTION") }}
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";
import ManageCollection from "@/components/Collection/ManageCollection.vue";
import { isMobile } from "@/services/view/responsive";
import { CollectionItem } from "@/models/collection";
@Component({
  components: { TopBar },
})
export default class Collection extends Vue {
  collections: CollectionItem[] = [];

  @Emit("close")
  close(): void {
    this.$router.back()
    return;
  }

  getCollections(): CollectionItem[] {
    const collectionString = localStorage.getItem("COLLECTION");
    if (!collectionString) return [];
    return JSON.parse(collectionString) as CollectionItem[];
  }

  updateCollections(): void {
    localStorage.setItem("COLLECTION", JSON.stringify(this.collections));
  }

  createCollection(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ManageCollection,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { collections: this.collections },
    });
  }

  edit(idx: number): void {
    this.$buefy.modal.open({
      parent: this,
      component: ManageCollection,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { collections: this.collections, mode: "EDIT", collection: this.collections[idx] },
      events: { update: this.update, remove: this.remove },
    });
  }

  update(col: CollectionItem): void {
    const idx = this.collections.findIndex((c) => c.id == col.id);
    if (idx > -1) {
      this.collections[idx] = col;
    }
    this.updateCollections();
  }

  remove(id: string): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("collection.myCollection.messages.confirmation.delete"),
      confirmText: this.$tc("common.button.confirm"),
      cancelText: this.$tc("common.button.cancel"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        const idx = this.collections.findIndex((c) => c.id == id);
        if (idx > -1) {
          this.collections = this.collections.splice(idx, 1);
        }
        this.updateCollections();
      },
    });
  }

  mounted(): void {
    this.collections = this.getCollections();
  }
}
</script>
<style scoped lang="scss">
.list-box {
  border: 1px solid gray !important;
  border-radius: 20px;
}
</style>
