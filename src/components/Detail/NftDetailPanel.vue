<template>
  <div :class="{ 'modal-card': true, 'min-width-table': !isMobile }">
    <top-bar :title="nft.name" :showClose="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <div class="columns is-mobile is-multiline">
        <div class="column is-6-tablet is-12-mobile">
          <span @click="preview(nft.uri)"><b-image :src="nft.uri" alt="A random image" ratio="6by4"></b-image></span>
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-field>
            <template #label>
              {{ nft.name }}
              <b-dropdown aria-role="list" class="is-pulled-right" :mobile-modal="false" position="is-bottom-left">
                <template #trigger>
                  <b-icon icon="dots-vertical" class="is-clickable"></b-icon>
                </template>
                <b-dropdown-item aria-role="listitem"
                  ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon>View on MintGarden</b-dropdown-item
                >
                <b-dropdown-item aria-role="listitem"
                  ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon>View on SkyNFT</b-dropdown-item
                >
                <b-dropdown-item aria-role="listitem"
                  ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon>View on Spacescan.io</b-dropdown-item
                >
                <b-dropdown-item aria-role="listitem"
                  ><b-icon class="media-left" icon="download" size="is-small"></b-icon>Download</b-dropdown-item
                >
              </b-dropdown>
            </template>
            NFT ID: xxxxxxxx <key-box icon="checkbox-multiple-blank-outline" value="xxxxxxxx"></key-box>
          </b-field>
          <b-field label="Collection">collection name </b-field>
          <b-field label="Create by"
            >OwnerID: yyyyyyyy <key-box icon="checkbox-multiple-blank-outline" value="yyyyyy"></key-box
          ></b-field>
          <b-field label="Description"> This is a description of the collection of objects of the given owner</b-field>
          <div class="buttons is-hidden-mobile">
            <b-button :label="'Transfer'" type="is-primary" @click="transfer()" icon-left="share" outlined></b-button>
            <b-button :label="'Make Offer'" type="is-info" @click="offer()" icon-left="email-send-outline" outlined></b-button>
          </div>
        </div>
        <div class="column is-12 is-hidden-mobile">
          <hr />
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-collapse class="card" animation="slide">
            <template #trigger="props">
              <div class="card-header" role="button" :aria-expanded="props.open">
                <p class="card-header-title">Properties</p>
                <a class="card-header-icon">
                  <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon>
                </a>
              </div>
            </template>
            <div class="columns is-mobile is-multiline card-content is-justify-content-center">
              <div class="column is-5 is-size-5 property m-2" v-for="index of 12" :key="index">
                <span class="has-text-grey is-size-7">
                  <p>{{ index }}</p>
                  xxxx</span
                >
              </div>
            </div>
          </b-collapse>
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-collapse class="card" animation="slide">
            <template #trigger="props">
              <div class="card-header" role="button" :aria-expanded="props.open">
                <p class="card-header-title">Details</p>
                <a class="card-header-icon">
                  <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon>
                </a>
              </div>
            </template>
            <div class="card-content">
              <ul>
                <li><span class="has-text-grey">NFT ID </span><span class="is-pulled-right">xxxxx</span></li>
                <li><span class="has-text-grey">Launcher ID </span><span class="is-pulled-right">xxxxx</span></li>
                <li><span class="has-text-grey">Owner DID </span><span class="is-pulled-right">xxxxx</span></li>
                <li><span class="has-text-grey">Royalty Percentage </span><span class="is-pulled-right">5%</span></li>
                <li><span class="has-text-grey">Minted at Block Height</span><span class="is-pulled-right">2189241</span></li>
                <li><span class="has-text-grey">Data URL 1</span><span class="is-pulled-right">xxxxx</span></li>
                <li><span class="has-text-grey">Data Hash</span><span class="is-pulled-right">xxxxxx</span></li>
                <li><span class="has-text-grey">Metadata URL 1</span><span class="is-pulled-right">https://pawket.app</span></li>
                <li><span class="has-text-grey">Metadata Hash</span><span class="is-pulled-right">0x4277...c8da</span></li>
                <li><span class="has-text-grey">License Hash</span><span class="is-pulled-right">0x00</span></li>
              </ul>
            </div>
          </b-collapse>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between is-block is-hidden-tablet">
      <div class="buttons is-pulled-right">
        <b-button :label="'Transfer'" type="is-primary" @click="transfer()" icon-left="share" outlined></b-button>
        <b-button :label="'Make Offer'" type="is-info" @click="offer()" icon-left="email-send-outline" outlined></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { isMobile } from "@/services/view/responsive";
import { AccountEntity } from "@/models/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "../KeyBox.vue";
import TopBar from "../TopBar.vue";
import NftOffer from "./NftOffer.vue";
import NftTransfer from "./NftTransfer.vue";
import { NftDetail } from "@/services/crypto/receive";

@Component({
  components: {
    KeyBox,
    TopBar,
  },
  filters: { demojo },
})
export default class NftDetailPanel extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() public nft!: NftDetail;

  @Emit("close")
  close(): void {
    return;
  }

  get isMobile(): boolean {
    return isMobile();
  }

  transfer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { nft: this.nft, account: this.account },
    });
  }

  offer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { nft: this.nft, account: this.account },
    });
  }

  preview(uri: string): void {
    this.$buefy.modal.open({
      parent: this,
      content: `<div class='modal-card'><img src="${uri}"></div>`,
      hasModalCard: true,
      trapFocus: true,
      props: {},
    });
  }
}
</script>
<style scoped lang="scss">
.property {
  border: 1px solid black;
  border-radius: 0.2vw;
  height: 5rem;
}

.min-width-table {
  min-width: 768px;
}
</style>
