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
                <a class="has-text-dark" :href="spaceScanUrl + nft.address" target="_blank">
                  <b-dropdown-item aria-role="listitem"
                    ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon
                    >{{ $t("nftDetail.ui.dropdown.spaceScan") }}
                  </b-dropdown-item>
                </a>
                <a class="has-text-dark" @click="crossOriginDownload(nft.metadata.uri, nft.metadata.name)">
                  <b-dropdown-item aria-role="listitem">
                    <b-icon class="media-left" icon="download" size="is-small"></b-icon>{{ $t("nftDetail.ui.dropdown.download") }}
                  </b-dropdown-item>
                </a>
              </b-dropdown>
            </template>
            {{ $t("nftDetail.ui.label.nftId") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="nft.address" :showValue="true"></key-box>
          </b-field>
          <b-field :label="$t('nftDetail.ui.label.collection')">{{ metadata.collection.name }}</b-field>
          <b-field :label="$t('nftDetail.ui.label.description')">
            <div v-if="metadata.description.length < 100">{{ metadata.description }}</div>
            <div v-else>
              <span>{{ metadata.description.slice(0, 100) }}</span
              ><span v-if="!showMore"
                >... <a @click="showMore = true">{{ $t("nftDetail.ui.button.showMore") }}</a></span
              ><span v-if="showMore"
                >{{ metadata.description.slice(100)
                }}<a @click="showMore = false">{{ $t("nftDetail.ui.button.showLess") }}</a></span
              >
            </div>
          </b-field>
          <div class="buttons is-hidden-mobile">
            <b-button
              :label="$t('nftDetail.ui.button.transfer')"
              type="is-primary"
              @click="transfer()"
              icon-left="share"
              :disabled="this.account.type == 'Address'"
              outlined
            ></b-button>
            <b-button
              :label="$t('nftDetail.ui.button.makeOffer')"
              type="is-info"
              @click="offer()"
              icon-left="email-send-outline"
              outlined
              :disabled="observeMode"
            ></b-button>
          </div>
        </div>
        <div class="column is-12 is-hidden-mobile">
          <hr />
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-collapse class="card" animation="slide">
            <template #trigger="props">
              <div class="card-header" role="button" :aria-expanded="props.open">
                <p class="card-header-title">{{ $t("nftDetail.ui.title.properties") }}</p>
                <a class="card-header-icon">
                  <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon>
                </a>
              </div>
            </template>
            <div class="columns is-mobile is-multiline card-content is-justify-content-space-between">
              <div class="column is-5 is-size-5 property m-2" v-for="(att, i) of metadata.attributes" :key="i">
                <span class="has-text-grey is-size-7 line-height-normal">
                  <p>{{ att.trait_type }}</p>
                  <b-tooltip multilined :label="String(att.value)" style="word-break: break-all">
                    <a @click="copy(att.value)">
                      <p class="has-text-grey-dark property-value">
                        {{ att.value }}
                      </p>
                    </a>
                  </b-tooltip>
                </span>
              </div>
            </div>
          </b-collapse>
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-collapse class="card" animation="slide">
            <template #trigger="props">
              <div class="card-header" role="button" :aria-expanded="props.open">
                <p class="card-header-title">{{ $t("nftDetail.ui.title.details") }}</p>
                <a class="card-header-icon"> <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon> </a>
              </div>
            </template>
            <div class="card-content">
              <!-- prettier-ignore -->
              <ul>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.nftId") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.address" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.launcherId") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.launcherId" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.ownerDid") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.didOwner" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.ownerAddress") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.p2Owner" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.royaltyPercentage") }}</span><span class="is-pulled-right">
                  {{ nft.analysis.tradePricePercentage/100 }}%</span></li>
                <li v-for="(data, index) of dataUrls" :key="index"><span class="has-text-grey">{{ $t("nftDetail.ui.details.dataUrl", {index: index + 1})}}</span><span class="is-pulled-right">
                  <a :href="data" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.dataHash") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.metadata.imageHash" :showValue="true"></key-box></span></li>
                <li v-for="(url, index) of metadataUrls" :key="index"><span class="has-text-grey">{{ $t("nftDetail.ui.details.metadataUrl", {index: index + 1}) }}</span><span class="is-pulled-right">
                  <a :href="url" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.metadataHash") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.metadata.metadataHash" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.licenseUrl") }}</span><span class="is-pulled-right">
                  <a :href="nft.analysis.metadata.licenseUri" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.licenseHash") }}</span><span class="is-pulled-right">
                  <key-box :value="nft.analysis.metadata.licenseHash" :showValue="true"></key-box></span></li>
                <li><span class="has-text-grey">{{ $t("nftDetail.ui.details.series") }}</span><span class="is-pulled-right">
                  {{ parseInt(nft.analysis.metadata.serialNumber, 16) }} / {{ parseInt(nft.analysis.metadata.serialTotal,16) }}</span></li>
              </ul>
            </div>
          </b-collapse>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between is-block is-hidden-tablet">
      <div class="buttons is-pulled-right">
        <b-button
          :label="$t('nftDetail.ui.button.transfer')"
          type="is-primary"
          @click="transfer()"
          icon-left="share"
          :disabled="this.account.type == 'Address'"
          outlined
        ></b-button>
        <b-button
          :label="$t('nftDetail.ui.button.makeOffer')"
          type="is-info"
          @click="offer()"
          icon-left="email-send-outline"
          outlined
          :disabled="observeMode"
        ></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { isMobile } from "@/services/view/responsive";
import { AccountEntity } from "@/models/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import TopBar from "@/components/Common/TopBar.vue";
import NftOffer from "@/components/Nft/NftOffer.vue";
import NftTransfer from "@/components/Nft/NftTransfer.vue";
import { NftDetail } from "@/services/crypto/receive";
import { NftOffChainMetadata } from "@/models/nft";
import store from "@/store";
import { crossOriginDownload } from "@/services/api/crossOriginDownload";

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
  public showMore = false;

  @Emit("close")
  close(): void {
    return;
  }

  get isMobile(): boolean {
    return isMobile();
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  async crossOriginDownload(url: string, filename: string | undefined): Promise<void> {
    const name = filename ?? "untitled";
    return crossOriginDownload(url, name);
  }

  get observeMode(): boolean {
    return this.account.type == "Address";
  }

  get dataUrls(): string[] {
    if (!this.nft.analysis.metadata.imageUri) return [];
    if (typeof this.nft.analysis.metadata.imageUri == "string") return [this.nft.analysis.metadata.imageUri];
    return this.nft.analysis.metadata.imageUri;
  }

  get metadataUrls(): string[] {
    if (!this.nft.analysis.metadata.metadataUri) return [];
    if (typeof this.nft.analysis.metadata.metadataUri == "string") return [this.nft.analysis.metadata.metadataUri];
    return this.nft.analysis.metadata.metadataUri;
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

  copy(text: string): void {
    store.dispatch("copy", text);
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

.line-height-normal {
  line-height: normal;
}

.property-value {
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
