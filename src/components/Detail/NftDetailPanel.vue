<template>
  <div :class="{ 'modal-card': true, 'min-width-table': !isMobile }">
    <top-bar :title="metadata.name" :showClose="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <div class="columns is-mobile is-multiline">
        <div class="column is-6-tablet is-12-mobile">
          <span @click="preview(nft.metadata.uri)"
            ><b-image :src="nft.metadata.uri" alt="A random image" ratio="6by4"></b-image
          ></span>
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-field>
            <template #label>
              {{ metadata.name }}
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
            NFT ID:
            <key-box icon="checkbox-multiple-blank-outline" :value="nft.address" :showValue="true"></key-box>
          </b-field>
          <b-field label="Collection">{{ metadata.collection.name }}</b-field>
          <b-field label="Create by"
            >OwnerID: yyyyyyyy <key-box icon="checkbox-multiple-blank-outline" value="yyyyyy"></key-box
          ></b-field>
          <b-field label="Description">{{ metadata.description }}</b-field>
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
              <div class="column is-5 is-size-5 property m-2" v-for="(att, i) of metadata.attributes" :key="i">
                <span class="has-text-grey is-size-7">
                  <p>{{ att.trait_type }}</p>
                  {{ att.value }}</span
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
                <a class="card-header-icon"> <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon> </a>
              </div>
            </template>
            <div class="card-content">
              <!-- prettier-ignore -->
              <ul>
                <li><span class="has-text-grey">NFT ID </span><span class="is-pulled-right">
                  <key-box :value="nft.address" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">Launcher ID </span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.launcherId" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">Owner DID </span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.currentOwner" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">Royalty Percentage </span><span class="is-pulled-right">
                  {{nft.analysis.tradePricePercentage/100}}%</span></li>
                <li><span class="has-text-grey">Minted at Block Height</span><span class="is-pulled-right">
                  xxx</span></li>
                <li><span class="has-text-grey">Data URL 1</span><span class="is-pulled-right">
                  <a :href="nft.analysis.metadata.imageUri" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a></span></li>
                <li><span class="has-text-grey">Data Hash</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.metadata.imageHash" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">Metadata URL 1</span><span class="is-pulled-right">
                  <a :href="nft.analysis.metadata.metadataUri" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a></span></li>
                <li><span class="has-text-grey">Metadata Hash</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.metadata.metadataHash" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">License Uri</span><span class="is-pulled-right">
                  <a :href="nft.analysis.metadata.licenseUri" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a></span></li>
                <li><span class="has-text-grey">License Hash</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.metadata.licenseHash" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">Series</span><span class="is-pulled-right">
                  {{nft.analysis.metadata.serialNumber}} / {{nft.analysis.metadata.serialTotal}}</span></li>
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
import { NftOffChainMetadata } from "@/models/nft";

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
  @Prop() public metadata!: NftOffChainMetadata;

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
