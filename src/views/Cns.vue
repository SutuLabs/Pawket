<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile }">
      <div class="mt-10">
        <img src="@/assets/cns.jpg" class="image is-96x96" style="margin: auto" />
        <p class="has-text-centered is-size-3 mt-5 mb-5 pb-4 has-text-color-cns has-text-weight-bold">Chia Name Service</p>
      </div>
      <div class="is-flex is-justify-content-center">
        <div class="control has-icons-left search-bar">
          <input
            class="input"
            placeholder="Search for a Chia Domain Name"
            v-model="name"
            type="search"
            :maxlength="63"
            @input.enter="reset()"
            @keyup.enter="search()"
          />
          <p v-if="errorMsg" class="has-text-danger">{{ errorMsg }}</p>
          <div id="dropdown-menu" role="menu" v-if="!showDetail && resolveAns">
            <div class="dropdown-content">
              <div class="dropdown-item">
                <div class="is-flex is-align-items-center is-clickable" v-if="resolveAns.status == 'Found'" @click="showResult()">
                  <i class="mdi has-text-info mdi-arrow-right-bold-circle mdi-18px"></i>
                  <span class="is-size-6 ml-2 is-flex-grow-2 break-all">{{ name.toLowerCase() }}.xch</span>
                  <span class="has-text-grey is-size-7"> Registered </span>
                </div>
                <div
                  class="is-flex is-align-items-center is-clickable"
                  v-if="resolveAns.status == 'NotFound'"
                  @click="showResult()"
                >
                  <i class="mdi has-text-success mdi-check-circle mdi-18px"></i>
                  <span class="is-size-6 ml-2 is-flex-grow-2 break-all">{{ name.toLowerCase() }}.xch</span>
                  <span class="has-text-grey is-size-7"> Available </span>
                </div>
                <div class="is-flex is-align-items-center is-clickable" v-if="resolveAns.status == 'Failure'">
                  <i class="mdi has-text-danger mdi-close-circle mdi-18px"></i>
                  <span class="is-size-6 ml-2 is-flex-grow-2 break-all">{{ name.toLowerCase() }}.xch</span>
                  <span class="has-text-grey is-size-7"> Failed </span>
                </div>
              </div>
            </div>
          </div>
          <span class="icon is-left">
            <i class="mdi mdi-magnify mdi-18px"></i>
          </span>
        </div>
        <p class="control">
          <a class="button is-primary is-loading" v-if="isResolving">Loading</a>
          <a class="button is-primary" v-else @click="search()">Search</a>
        </p>
      </div>
      <div v-if="showDetail" class="is-flex is-justify-content-center mt-4">
        <div class="column is-11" v-if="resolveAns">
          <span class="is-size-5 has-text-grey mb-4">Result</span>
          <div class="box mt-4" v-if="resolveAns.status == 'Found'">
            <a class="has-text-link is-size-5 break-all" :href="`https://${name}.xch.cool`" target="_blank"
              >{{ name.toLowerCase() }}.xch<i class="mdi mdi-open-in-new"></i
            ></a>
            <p class="has-text-grey break-all">{{ ownerAddress }}</p>
          </div>
          <div class="card mt-4" v-if="resolveAns.status == 'NotFound'">
            <header class="card-header">
              <p class="card-header-title break-all">{{ name }}.xch</p>
            </header>
            <div class="card-content">
              <div class="content">
                <p>
                  <span class="is-size-5 has-text-weight-bold">{{ name }}.xch </span
                  ><span class="has-text-success"><i class="mdi mdi-check-circle mdi-18px"></i>AVAILABLE</span>
                </p>
                <p>
                  <span class="is-size-6 has-text-grey">Registration Period</span><span class="is-pulled-right"> 1 Year </span>
                </p>
                <p>
                  <span class="is-size-6 has-text-grey">Registration Price</span
                  ><span class="is-pulled-right">{{ price.price / 1000000000000 }} XCH</span>
                </p>
                <p>
                  <span class="is-size-6 has-text-grey">Royalty Percentage</span
                  ><span class="is-pulled-right">{{ price.royaltyPercentage / 100 }} %</span>
                </p>
                <p>
                  <span class="is-size-6 has-text-grey">Total</span
                  ><span class="is-pulled-right"
                    >{{ (price.price * (10000 + price.royaltyPercentage)) / 10000000000000000 }} XCH</span
                  >
                </p>
              </div>
              <div class="has-text-right"><button class="button is-primary" @click="showModal = true">Register</button></div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5">
        <p class="is-size-5 py-4" @click="showCns()">
          Your CNS <b-button loading size="is-small" rounded v-if="isLoading" type="is-text"></b-button>
          <b-icon class="is-pulled-right pt-1" :icon="showMyCns ? 'chevron-down' : 'chevron-right'"></b-icon>
        </p>
        <div v-if="showMyCns">
          <ul class="is-flex columns is-multiline is-mobile my-2" v-if="cnses">
            <li class="column is-4-tablet is-6-mobile" v-for="(cns, i) of cnses" :key="i">
              <div class="nft-image-container">
                <img
                  class="nft-image is-clickable cover"
                  v-if="cns.metadata.uri"
                  @click="viewCnsDetail(cns)"
                  :src="cns.metadata.uri"
                />
                <img class="nft-image is-clickable cover" v-else src="@/assets/nft-no-image.png" @click="viewCnsDetail(cns)" />
                <p class="nft-name has-background-white-ter pt-2 pl-3 is-hidden-mobile">
                  <span class="is-inline-block truncate">{{
                    extraInfo[cns.address].metadata ? extraInfo[cns.address].metadata.name : ""
                  }}</span>
                  <span class="is-pulled-right">
                    <b-dropdown aria-role="list" class="is-pulled-right" :mobile-modal="false" position="is-bottom-left">
                      <template #trigger>
                        <b-icon icon="dots-vertical" class="is-clickable"></b-icon>
                      </template>
                      <a class="has-text-dark" :href="spaceScanUrl + cns.address" target="_blank">
                        <b-dropdown-item aria-role="listitem"
                          ><b-icon class="media-left" icon="open-in-new" size="is-small"></b-icon
                          >{{ $t("nftDetail.ui.dropdown.spaceScan") }}
                        </b-dropdown-item>
                      </a>
                    </b-dropdown>
                  </span>
                </p>
              </div>
            </li>
          </ul>
          <div v-if="!isLoading && !cnses.length" style="min-height: 200px" class="is-hidden-mobile has-text-grey pt-4 is-size-5">
            No Chia Domain Name Here. Search to Get One.
          </div>
        </div>
      </div>
    </div>
    <div :class="{ modal: true, 'is-active': showModal }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Register {{ name }}.xch</p>
          <button class="delete" aria-label="close" @click="showModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Name</label>
            <div class="control">
              <input class="input" type="text" disabled :value="name + '.xch'" />
            </div>
          </div>
          <address-field :inputAddress="address" @updateAddress="updateAddress"></address-field>
        </section>
        <footer class="modal-card-foot is-block">
          <button class="button" @click="showModal = false">Cancel</button>
          <button
            :class="{ button: true, 'is-primary': true, 'is-pulled-right': true, 'is-loading': registering }"
            @keyup.enter="register()"
            @click="register()"
          >
            Register
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getPrice, Price, register } from "@/services/api/cns-register";
import { ResolveFailureAnswer, resolveName, StandardResolveAnswer } from "@/services/api/resolveName";
import { bech32m } from "@scure/base";
import { Component, Vue, Watch } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import AddressField from "@/components/Common/AddressField.vue";
import store from "@/store";
import { AccountEntity, CustomCat } from "@/models/account";
import TakeOffer from "@/components/Offer/Take.vue";
import { getAllCats } from "@/store/modules/account";
import { isMobile } from "@/services/view/responsive";
import { DidDetail, NftDetail } from "@/services/crypto/receive";
import { DonwloadedNftCollection, NftOffChainMetadata } from "@/models/nft";
import { getScalarString } from "@/services/coin/nft";
import utility from "@/services/crypto/utility";
import { unprefix0x } from "@/services/coin/condition";
import NftDetailPanel from "@/components/Nft/NftDetailPanel.vue";

@Component({
  components: {
    AddressField,
  },
})
export default class Cns extends Vue {
  public name = "";
  public resolveAns: StandardResolveAnswer | ResolveFailureAnswer | null = null;
  public isResolving = false;
  public showDetail = false;
  public ownerAddress = "";
  public errorMsg = "";
  public showModal = false;
  public address = "";
  public period = 1;
  public price: Price = { price: -1, royaltyPercentage: -1 };
  public registerErrMsg = "";
  public offer = "";
  public registering = false;
  public showMyCns = false;
  public isLoading = false;

  get path(): string {
    return this.$route.path;
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }

  get cnses(): NftDetail[] {
    return this.account.nfts?.filter((nft) => nft.analysis != null && "cnsName" in nft.analysis) ?? [];
  }

  get dids(): DidDetail[] {
    return this.account.dids ?? [];
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  get isMobile(): boolean {
    return isMobile();
  }

  get extraInfo(): DonwloadedNftCollection {
    return this.account.extraInfo ?? {};
  }

  async showCns(): Promise<void> {
    if (this.showMyCns) {
      this.showMyCns = false;
    } else {
      this.isLoading = true;
      this.showMyCns = true;
      await store.dispatch("refreshNfts");
      this.isLoading = false;
    }
  }

  viewCnsDetail(nft: NftDetail): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftDetailPanel,
      hasModalCard: true,
      trapFocus: true,
      width: 1000,
      fullScreen: isMobile(),
      canCancel: ["outside", "escape"],
      props: { nft: nft, metadata: this.extraInfo[nft.address].metadata, account: this.account, dids: this.dids },
    });
  }

  @Watch("cnses")
  async downloadRelated(): Promise<void> {
    for (let i = 0; i < this.cnses.length; i++) {
      const nft = this.cnses[i];
      const ext = this.extraInfo[nft.address];
      if (!ext) {
        // this.extraInfo[nft.address] = { status: !nft.analysis.metadata.metadataUri ? "NoMetadata" : "Ready" };
        Vue.set(this.extraInfo, nft.address, {
          status: !nft.analysis.metadata.metadataUri ? "NoMetadata" : "Ready",
          metadata: {},
        });
        await this.downloadNftMetadata(nft); // don't need wait, just fire and change ui after some information got
      }
    }
    Vue.set(this.account, "extraInfo", this.extraInfo);
  }

  async downloadNftMetadata(nft: NftDetail): Promise<void> {
    const uri = getScalarString(nft.analysis.metadata.metadataUri);
    if (!uri) return;
    // console.log("start download nft", nft.analysis.metadata.metadataUri);
    const resp = await fetch(uri);
    const body = await resp.blob();
    const bodyhex = utility.toHexString(await utility.purehash(await body.arrayBuffer()));
    try {
      const md = JSON.parse(await body.text()) as NftOffChainMetadata;
      this.extraInfo[nft.address].metadata = md;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("cannot parse metadata", error);
      }
      this.extraInfo[nft.address].metadata = undefined;
    }
    // console.log("downloaded", bodyhex, nft.analysis.metadata.metadataHash, md);
    this.extraInfo[nft.address].status = "Processed";
    this.extraInfo[nft.address].matchHash = bodyhex.toLowerCase() == unprefix0x(nft.analysis.metadata.metadataHash).toLowerCase();
  }

  @Watch("path")
  onPathChange(): void {
    this.$destroy();
  }

  async search(): Promise<void> {
    this.isResolving = true;
    if (this.name.length < 6) {
      this.errorMsg = "The name is too short, at least 6 characters are required.";
      this.isResolving = false;
      return;
    }
    this.resolveAns = await resolveName(`${this.name}.xch`);
    if (this.resolveAns.status != "Failure") {
      this.ownerAddress = bech32m.encode(
        "xch",
        bech32m.toWords(this.fromHexString((this.resolveAns as StandardResolveAnswer).data ?? ""))
      );
      if (this.resolveAns.status == "NotFound") await this.getPrice();
    }

    this.isResolving = false;
  }

  showResult(): void {
    this.showDetail = true;
    return;
  }

  async getPrice(): Promise<void> {
    this.price = await getPrice(`${this.name}.xch`);
  }

  async register(): Promise<void> {
    this.registering = true;
    const res = await register(`${this.name}.xch`, this.address);
    if (res?.success) {
      this.offer = res.offer ?? "";
      this.address = "";
      this.takeOffer();
    } else {
      const reason = res?.reason ?? "Unknown Error";
      Notification.open({
        message: "Register Failed" + reason,
        type: "is-danger",
        duration: 5000,
      });
    }
    this.registering = false;
  }

  takeOffer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        tokenList: this.tokenList,
        inputOfferText: this.offer,
        close: (this.showModal = false),
      },
    });
  }

  updateAddress(value: string): void {
    this.address = value;
    this.registerErrMsg = "";
  }

  reset(): void {
    this.resolveAns = null;
    this.errorMsg = "";
    this.address = "";
  }

  clear(): void {
    this.showDetail = false;
    this.name = "";
    this.resolveAns = null;
    this.errorMsg = "";
    this.registerErrMsg = "";
    this.address = "";
    this.offer = "";
  }

  get offerUri(): string {
    const dataPrefix = "data:text/txt;charset=utf-8";
    const content = `${dataPrefix},${this.offer}`;
    return encodeURI(content);
  }

  fromHexString(hexString: string): Uint8Array {
    if (!hexString) return new Uint8Array();
    const reg = hexString.match(/.{1,2}/g);
    if (!reg) return new Uint8Array();
    return new Uint8Array(reg.map((byte) => parseInt(byte, 16)));
  }
}
</script>
<style scoped lang="scss">
.search-bar {
  min-width: 80%;
}

.has-text-color-cns {
  color: #40ac5c;
}

.mt-10 {
  margin-top: 8vh;
}

.break-all {
  word-break: break-all;
}

.nav-box {
  max-width: 1000px;
  margin: auto;
}

.nft-image-container {
  position: relative;
  aspect-ratio: 1 / 1;
}
.nft-image {
  border-radius: 0.5vw;
  width: 100%;
  border: 0;
}

.nft-name {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 40px;
  border-bottom-right-radius: 0.5vw;
  border-bottom-left-radius: 0.5vw;
}

.truncate {
  width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cover {
  object-fit: cover;
  aspect-ratio: 1 / 1;
  width: 100%;
}
</style>
