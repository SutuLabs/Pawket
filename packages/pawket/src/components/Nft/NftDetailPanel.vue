<template>
  <div :class="{ 'modal-card': true, 'min-width-table': !isMobile }">
    <top-bar :title="metadata == null ? 'Unnamed' : metadata.name" :showClose="true" @close="close()"></top-bar>
    <section class="modal-card-body">
      <div class="columns is-mobile is-multiline">
        <div class="column is-6-tablet is-12-mobile">
          <span @click="preview(nft.metadata.uri)"
            ><b-image
              v-if="getImageUrls(nft).length"
              :data-fallback="0"
              @error="fallBack($event, nft)"
              :src="getImageUrls(nft)[0]"
              alt="NFT image"
              ratio="1by1"
            ></b-image
          ></span>
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-field>
            <template #label>
              {{ metadata == null ? "Unnamed" : metadata.name }}
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
                <a class="has-text-dark" :href="mintGardenUrl + nft.address" target="_blank">
                  <b-dropdown-item aria-role="listitem"
                    ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon
                    >{{ $t("nftDetail.ui.dropdown.mintGarden") }}
                  </b-dropdown-item>
                </a>
                <a class="has-text-dark" @click="setAsProfilePic(nft.metadata.uri)">
                  <b-dropdown-item aria-role="listitem">
                    <b-icon class="media-left" icon="account-box" size="is-small"></b-icon
                    >{{ $t("nftDetail.ui.dropdown.setAsProfilePic") }}
                  </b-dropdown-item>
                </a>
                <a class="has-text-dark" @click="openSignMessage()" v-if="!observeMode && !publicKeyAcc">
                  <b-dropdown-item aria-role="listitem">
                    <b-icon class="media-left" icon="lead-pencil" size="is-small"></b-icon
                    >{{ $t("nftDetail.ui.dropdown.signWithNft") }}
                  </b-dropdown-item>
                </a>
                <a class="has-text-danger" @click="nftBurn()">
                  <b-dropdown-item aria-role="listitem" class="has-text-danger">
                    <b-icon class="media-left" icon="trash-can-outline" size="is-small"></b-icon
                    >{{ $t("nftDetail.ui.dropdown.nftBurn") }}
                  </b-dropdown-item>
                </a>
              </b-dropdown>
            </template>
            {{ $t("nftDetail.ui.label.nftId") }}
            <key-box
              icon="checkbox-multiple-blank-outline"
              :value="nft.address"
              :showValue="true"
              position="is-bottom"
              tooltipSize="is-small"
            ></key-box>
          </b-field>
          <b-field :label="$t('nftDetail.ui.label.collection')">{{
            metadata && metadata.collection ? metadata.collection.name : ""
          }}</b-field>
          <b-field :label="$t('nftDetail.ui.label.description')">
            <div v-if="!metadata || !metadata.description" class="pb-6"></div>
            <div v-else-if="metadata.description.length < 100">{{ metadata.description }}</div>
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
          <div v-if="nft.analysis.hasOwnProperty('cnsName')" class="mb-2">
            <b-field :label="$t('nftDetail.ui.label.expirationDate')">{{ metadata ? metadata.attributes[0].value : "" }}</b-field>
          </div>
          <div class="buttons is-hidden-mobile">
            <b-button
              :label="isIos ? $t('nftDetail.ui.button.iosTransfer') : $t('nftDetail.ui.button.transfer')"
              type="is-primary"
              @click="transfer()"
              icon-left="share"
              :disabled="account.type == 'Address'"
              outlined
            ></b-button>
            <b-button
              v-if="!isIos"
              :label="$t('nftDetail.ui.button.makeOffer')"
              type="is-info"
              @click="offer()"
              icon-left="email-send-outline"
              outlined
              :disabled="observeMode"
            ></b-button>
            <b-button
              :label="$t('nftDetail.ui.button.move')"
              type="is-info"
              @click="move()"
              icon-left="image-move"
              outlined
              :disabled="observeMode"
            ></b-button>
          </div>
        </div>
        <div class="column is-12 is-hidden-mobile">
          <hr />
        </div>
        <div class="column is-6-tablet is-12-mobile">
          <b-collapse class="card" animation="slide" v-if="nft.analysis.cnsExpiry && nft.analysis.cnsAddress">
            <template #trigger="props">
              <div class="card-header" role="button" :aria-expanded="props.open">
                <p class="card-header-title">{{ $t("nftDetail.ui.title.bindingInformation") }}</p>
                <a class="card-header-icon">
                  <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon>
                </a>
              </div>
            </template>
            <div class="card-content">
              <ul>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.bindingInformation.address") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="
                        nft.analysis.metadata.bindings && nft.analysis.metadata.bindings.address
                          ? getAddressFromPuzzleHash(nft.analysis.metadata.bindings.address)
                          : ''
                      "
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.bindingInformation.publicKey") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="
                        nft.analysis.metadata.bindings && nft.analysis.metadata.bindings.publicKey
                          ? nft.analysis.metadata.bindings.publicKey
                          : ''
                      "
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.bindingInformation.did") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="
                        nft.analysis.metadata.bindings && nft.analysis.metadata.bindings.did
                          ? getDidFromPuzzleHash(nft.analysis.metadata.bindings.did)
                          : ''
                      "
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.bindingInformation.text") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="
                        nft.analysis.metadata.bindings && nft.analysis.metadata.bindings.text
                          ? nft.analysis.metadata.bindings.text
                          : ''
                      "
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
              </ul>
              <b-button
                v-if="updatable"
                :label="$t('nftDetail.ui.bindingInformation.edit')"
                type="is-primary"
                @click="editBindingInfo()"
                icon-left="pencil"
                outlined
                expanded
                class="mt-2"
              ></b-button>
            </div>
          </b-collapse>
          <b-collapse class="card" animation="slide">
            <template #trigger="props">
              <div class="card-header" role="button" :aria-expanded="props.open">
                <p class="card-header-title">{{ $t("nftDetail.ui.title.properties") }}</p>
                <a class="card-header-icon">
                  <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"> </b-icon>
                </a>
              </div>
            </template>
            <div
              class="columns is-mobile is-multiline card-content is-justify-content-space-between"
              v-if="metadata && metadata.attributes"
            >
              <div class="column is-5 is-size-5 property m-2" v-for="(att, index) of metadata.attributes" :key="index">
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
              <ul>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.nftId") }}</span
                  ><span class="is-pulled-right">
                    <key-box :value="nft.address" :showValue="true" position="is-left" tooltipSize="is-small"></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.launcherId") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="nft.analysis.launcherId"
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.ownerDid") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :display="shorten(getDidFromPuzzleHash(nft.analysis.didOwner, true))"
                      :showValue="false"
                      :value="getDidFromPuzzleHash(nft.analysis.didOwner)"
                      :tooltip="getDidFromPuzzleHash(nft.analysis.didOwner)"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.ownerAddress") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="getAddressFromPuzzleHash(nft.analysis.p2Owner)"
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.royaltyPercentage") }}</span
                  ><span class="is-pulled-right"> {{ nft.analysis.tradePricePercentage / 100 }}%</span>
                </li>
                <div>
                  <li v-for="(data, index) of dataUrls" :key="index">
                    <span class="has-text-grey">{{ $t("nftDetail.ui.details.dataUrl", { index: index + 1 }) }}</span
                    ><span class="is-pulled-right">
                      <a :href="data" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a
                    ></span>
                  </li>
                </div>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.dataHash") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="nft.analysis.metadata.imageHash"
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <div>
                  <li v-for="(url, index) of metadataUrls" :key="index">
                    <span class="has-text-grey">{{ $t("nftDetail.ui.details.metadataUrl", { index: index + 1 }) }}</span
                    ><span class="is-pulled-right">
                      <a :href="url" target="_blank"><b-icon icon="open-in-new" size="is-small"></b-icon></a
                    ></span>
                  </li>
                </div>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.metadataHash") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="nft.analysis.metadata.metadataHash"
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.licenseUrl") }}</span
                  ><span class="is-pulled-right" v-if="nft.analysis.metadata.licenseUri">
                    <a :href="nft.analysis.metadata.licenseUri" target="_blank"
                      ><b-icon icon="open-in-new" size="is-small"></b-icon></a
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.licenseHash") }}</span
                  ><span class="is-pulled-right">
                    <key-box
                      :value="nft.analysis.metadata.licenseHash"
                      :showValue="true"
                      position="is-left"
                      tooltipSize="is-small"
                    ></key-box
                  ></span>
                </li>
                <li>
                  <span class="has-text-grey">{{ $t("nftDetail.ui.details.series") }}</span
                  ><span class="is-pulled-right" v-if="nft.analysis.metadata.serialNumber && nft.analysis.metadata.serialTotal">
                    {{ parseInt(nft.analysis.metadata.serialNumber, 16) }} /
                    {{ parseInt(nft.analysis.metadata.serialTotal, 16) }}</span
                  >
                </li>
              </ul>
            </div>
          </b-collapse>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between is-block is-hidden-tablet">
      <div class="buttons is-pulled-right">
        <b-button
          :label="isIos ? $t('nftDetail.ui.button.iosTransfer') : $t('nftDetail.ui.button.transfer')"
          type="is-primary"
          @click="transfer()"
          icon-left="share"
          :disabled="account.type == 'Address'"
          outlined
        ></b-button>
        <b-button
          v-if="!isIos"
          :label="$t('nftDetail.ui.button.makeOffer')"
          type="is-info"
          @click="offer()"
          icon-left="email-send-outline"
          outlined
          :disabled="observeMode"
        ></b-button>
        <b-button label="Move" type="is-info" @click="move()" icon-left="image-move" outlined :disabled="observeMode"></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { AccountEntity } from "../../../../pawket-chia-lib/models/account";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import TopBar from "@/components/Common/TopBar.vue";
import NftOffer from "@/components/Nft/NftOffer.vue";
import NftTransfer from "@/components/Nft/NftTransfer.vue";
import { DidDetail, NftDetail } from "../../../../pawket-chia-lib/services/crypto/receive";
import { NftOffChainMetadata } from "../../../../pawket-chia-lib/models/nft";
import store from "@/store";
import { notifyPrimary } from "@/services/notification/notification";
import NftMove from "./NftMove.vue";
import NftUpdate from "./NftUpdate.vue";
import puzzle from "../../../../pawket-chia-lib/services/crypto/puzzle";
import { xchPrefix } from "@/store/modules/network";
import { shorten } from "@/filters/addressConversion";
import EditCnsBindings from "../Cns/EditCnsBindings.vue";
import { modshash } from "../../../../pawket-chia-lib/services/coin/mods";
import { tc } from "@/i18n/i18n";
import SignMessage from "../Cryptography/SignMessage.vue";
import { getScalarString } from "../../../../pawket-chia-lib/services/coin/nft";
import { isIos } from "../../../../pawket-chia-lib/services/util/platform";

@Component({
  components: {
    KeyBox,
    TopBar,
  },
})
export default class NftDetailPanel extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: NftDetail;
  @Prop() public inputMetadata!: NftOffChainMetadata | null;
  @Prop() public dids!: DidDetail[];
  public showMore = false;
  public metadata: NftOffChainMetadata | null = null;
  public mintGardenUrl = "https://mintgarden.io/nfts/";
  fallBackList = ["https://assets.spacescan.io/xch/img/nft/full/", "https://nft.dexie.space/preview/medium/"];

  @Emit("close")
  close(): void {
    return;
  }

  get isMobile(): boolean {
    return isMobile();
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get publicKeyAcc(): boolean {
    return this.account.type == "PublicKey";
  }

  get path(): string {
    return this.$route.path;
  }

  get isIos(): boolean {
    return isIos();
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  get updatable(): boolean {
    return this.nft.analysis.metadataUpdaterPuzzleHash == modshash["nft_metadata_updater_cns"];
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  get accountId(): number {
    return store.state.account.selectedAccount;
  }

  setAsProfilePic(url: string): void {
    store.dispatch("setProfilePic", { idx: this.accountId, profilePic: url });
    notifyPrimary(this.$tc("common.message.saved"));
  }

  getImageUrls(nft: NftDetail): string[] {
    if (!nft.analysis.metadata.imageUri) return [];
    if (typeof nft.analysis.metadata.imageUri == "string") return [nft.analysis.metadata.imageUri];
    return nft.analysis.metadata.imageUri;
  }

  fallBack(event: Event, nft: NftDetail): void {
    const img = event.target as HTMLImageElement;
    if (img.src == "@/assets/nft-no-image.png") return;
    let fallBackIndex = Number(img.getAttribute("data-fallback"));
    const imageUrls = this.getImageUrls(nft);
    let totalFallback = this.fallBackList.length + imageUrls.length;
    fallBackIndex++;
    img.dataset.fallback = fallBackIndex.toString();
    if (fallBackIndex > totalFallback) {
      img.src = "@/assets/nft-no-image.png";
    } else {
      if (fallBackIndex < imageUrls.length) img.src = imageUrls[fallBackIndex];
      else {
        if (img.src.endsWith(".gif")) img.src = this.fallBackList[fallBackIndex - imageUrls.length] + nft.address + ".gif";
        else img.src = this.fallBackList[fallBackIndex - imageUrls.length] + nft.address + ".webp";
      }
    }
    nft.metadata.uri = img.src;
  }

  openSignMessage(): void {
    this.$buefy.modal.open({
      parent: this,
      component: SignMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        nft: this.nft.analysis,
      },
    });
  }

  nftBurn(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: {
        title: tc("nftBurn.title"),
        descriptionText: tc("nftBurn.description"),
        confirmationText: tc("nftBurn.confirmation"),
        nft: this.nft,
        account: this.account,
        inputAddress: "xch1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqm6ks6e8mvy",
        addressEditable: false,
      },
    });
  }

  getDidFromPuzzleHash(hash: string, name = false): string {
    if (!hash || hash.length < 10) return "";
    const did = puzzle.getAddressFromPuzzleHash(hash, "did:chia:");
    if (name) {
      const idx = this.dids.findIndex((d) => d.did == did);
      if (idx > -1) return this.dids[idx].name;
    }
    return did;
  }

  shorten(name: string): string {
    return shorten(name);
  }

  getAddressFromPuzzleHash(hash: string): string {
    try {
      return puzzle.getAddressFromPuzzleHash(hash, xchPrefix());
    } catch (err) {
      return "";
    }
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

  editBindingInfo(): void {
    this.$buefy.modal.open({
      parent: this,
      component: EditCnsBindings,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { nft: this.nft, account: this.account },
    });
  }

  move(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftMove,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { nft: this.nft, account: this.account },
    });
  }

  update(): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftUpdate,
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

  async downloadNftMetadata(nft: NftDetail): Promise<void> {
    const uri = getScalarString(nft.analysis.metadata.metadataUri);
    if (!uri) {
      this.metadata = null;
      return;
    }
    try {
      const resp = await fetch(uri);
      const body = await resp.blob();
      const md = JSON.parse(await body.text()) as NftOffChainMetadata;
      this.metadata = md;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("cannot parse metadata", error);
      }
      this.metadata = null;
    }
  }

  mounted(): void {
    if (!this.inputMetadata) this.downloadNftMetadata(this.nft);
    else this.metadata = this.inputMetadata;
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
