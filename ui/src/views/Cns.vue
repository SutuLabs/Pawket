<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile }">
      <div class="mt-10">
        <img src="@/assets/cns.jpg" class="image is-96x96" style="margin: auto" />
        <p class="has-text-centered is-size-3 pb-4 has-text-color-cns has-text-weight-bold">
          {{ $t("cns.title") }}
          <span v-if="isTestnet" class="mb-3 is-size-7 has-text-weight-normal">testnet</span>
        </p>
      </div>
      <div class="is-flex is-justify-content-center px-3">
        <div class="control has-icons-left search-bar">
          <input
            class="input"
            :placeholder="$t('cns.placeholder')"
            v-model="name"
            type="search"
            :maxlength="63"
            @input.enter="reset()"
            @keyup.enter="search()"
          />
          <span class="icon is-left">
            <i class="mdi mdi-magnify mdi-18px"></i>
          </span>
        </div>
        <p class="control">
          <a class="button is-primary is-loading" v-if="isResolving">{{ $t("cns.button.loading") }}</a>
          <a class="button is-primary" v-else @click="search()">{{ $t("cns.button.search") }}</a>
        </p>
      </div>
      <div v-if="showDetail && !isResolving" class="is-flex is-justify-content-center mt-4 mx-4">
        <div class="column is-11" v-if="resolveAns">
          <span class="is-size-5 has-text-white mb-4">{{ $t("cns.label.result") }}</span>
          <div class="card mt-4">
            <header class="card-header">
              <p v-if="resolveAns.status == 'Found'" class="card-header-title break-all">
                <a class="has-text-link is-size-5 break-all" :href="cnsUrl" target="_blank"
                  >{{ cnsName }}<i class="mdi mdi-open-in-new"></i
                ></a>
              </p>
              <p v-else class="card-header-title break-all">{{ cnsName }}</p>
            </header>
            <div class="card-content">
              <div class="content">
                <p>
                  <span class="is-size-5 has-text-weight-bold">{{ cnsName }}</span>
                  <span v-if="price.code == 'TooShort'" class="has-text-warning"
                    ><i class="mdi mdi-dots-horizontal-circle mdi-18px"></i>{{ $t("cns.label.notOpenYet") }}</span
                  >
                  <span v-else-if="resolveAns.status == 'Found'" class="has-text-info"
                    ><i class="mdi mdi-arrow-right-bold-circle mdi-18px"></i>{{ $t("cns.label.registered") }}</span
                  >
                  <span v-else-if="resolveAns.status == 'NotFound' && price.price > 0" class="has-text-success"
                    ><i class="mdi mdi-check-circle mdi-18px"></i>{{ $t("cns.label.available") }}</span
                  >
                  <span v-else-if="resolveAns.status == 'Failure'" class="has-text-danger"
                    ><i class="mdi mdi-alert-circle mdi-18px"></i>{{ $t("cns.label.networkIssue") }}</span
                  >
                  <span v-else class="has-text-danger"
                    ><i class="mdi mdi-close-circle mdi-18px"></i>{{ $t("cns.label.unavailable") }}</span
                  >
                </p>

                <p v-if="price.code == 'TooShort'">
                  {{ $t("cns.message.notOpen", { minLength }) }}
                </p>

                <template v-else-if="resolveAns.status == 'Found'">
                  {{ $t("cns.message.registered") }}
                  <a class="has-text-link" :href="cnsUrl" target="_blank"
                    >{{ $t("cns.message.profileHomepage") }}<i class="mdi mdi-open-in-new"></i></a
                  >.
                  <br />
                  <ul class="mb-6">
                    <li v-if="resolveAns.expiry">
                      {{ $t("cns.label.ExpiryDate") }} {{ new Date(resolveAns.expiry * 1000).toLocaleDateString() }}
                    </li>
                    <li v-if="resolveAns.expiry">{{ $t("cns.label.Status") }} {{ getStatus(resolveAns.expiry) }}</li>
                  </ul>
                  <div v-if="!(price.price > 0)" class="field is-horizontal">
                    <div class="field-body">
                      <div class="field has-addons">
                        <p class="control is-expanded has-icons-left">
                          <input class="input" type="number" min="1" max="99" v-model="regYear" />
                          <span class="icon is-small is-left">
                            <i class="mdi mdi-calendar"></i>
                          </span>
                        </p>
                        <div class="control">
                          <a class="button is-static"> {{ $t("cns.label.years") }} </a>
                        </div>
                      </div>
                    </div>
                    <div class="control ml-1">
                      <button class="button is-link" @click="getPrice()">{{ $t("cns.button.renew") }}</button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="has-text-danger" v-if="price.code && price.code == 'NameUnavailable'">{{
                    $t("cns.message.unavailable")
                  }}</span>
                  <span class="has-text-danger" v-else>{{ price.reason }}</span>
                </template>
                <template v-if="price.price > 0">
                  <p class="my-5">
                    <span class="is-size-6 has-text-grey">{{ $t("cns.label.registrationPeriod") }}</span>
                    <span class="is-pulled-right">
                      <div class="field-body">
                        <div class="field has-addons">
                          <p class="control is-expanded has-icons-left">
                            <input class="input is-small" type="number" min="1" max="99" v-model="regYear" @change="getPrice()" />
                            <span class="icon is-small is-left">
                              <i class="mdi mdi-calendar"></i>
                            </span>
                          </p>
                          <div class="control">
                            <a class="button is-static is-small"> {{ $t("cns.label.years") }} </a>
                          </div>
                        </div>
                      </div>
                    </span>
                  </p>
                  <p>
                    <span class="is-size-6 has-text-grey">{{ $t("cns.label.registrationFee") }}</span
                    ><span class="is-pulled-right">{{ price.registrationFee / 1000000000000 }} {{ unit }}</span>
                  </p>
                  <p>
                    <span class="is-size-6 has-text-grey">{{ $t("cns.label.annualFee") }}</span
                    ><span class="is-pulled-right">{{ price.annualFee / 1000000000000 }} {{ unit }}</span>
                  </p>
                  <p>
                    <span class="is-size-6 has-text-grey">{{ $t("cns.label.royaltyPercentage") }}</span
                    ><span class="is-pulled-right">{{ price.royaltyPercentage / 100 }} %</span>
                  </p>
                  <p>
                    <span class="is-size-6 has-text-grey">{{ $t("cns.label.total") }}</span
                    ><span class="is-pulled-right"
                      >{{ (price.price * (10000 + price.royaltyPercentage)) / 10000000000000000 }} {{ unit }}</span
                    >
                  </p>

                  <div class="has-text-right">
                    <button
                      class="button is-cns"
                      @click="
                        showFill = false;
                        showModal = true;
                      "
                    >
                      <span v-if="renew">{{ $t("cns.button.renew") }}</span>
                      <span v-else>{{ $t("cns.button.register") }}</span>
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5">
        <p class="is-size-5 py-4 is-clickable" @click="showCns()">
          {{ $t("cns.label.myNames") }} <b-button loading size="is-small" rounded v-if="isLoading" type="is-text"></b-button>
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
                  <span class="is-inline-block truncate">{{ getCnsName(cns.address) }}</span>
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
          <div v-if="!isLoading && !cnses.length" style="min-height: 200px" class="has-text-grey pt-4 is-size-5">
            {{ $t("cns.message.noName") }}
          </div>
        </div>
      </div>
    </div>
    <div :class="{ modal: true, 'is-active': showModal }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <top-bar
          :title="$t('cns.label.register', { cnsName: name.toLowerCase() })"
          @close="showModal = false"
          :showClose="true"
        ></top-bar>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">{{ $t("cns.label.name") }}</label>
            <div class="control">
              <input class="input" type="text" disabled :value="cnsName" />
            </div>
          </div>
          <div class="field">
            <label class="label">{{ $t("cns.label.address") }}</label>
            <button v-if="!showFill" class="button is-text" @click="showFill = true">
              {{ $t("cns.message.clickToBindAddress") }}
            </button>
            <div v-else class="control">
              <p class="is-size-7 has-text-grey">{{ $t("cns.message.autoBoundHint") }}</p>
              <address-field :inputAddress="address" @updateAddress="updateAddress" label=" "></address-field>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot is-block">
          <button class="button" @click="showModal = false">{{ $t("cns.button.cancel") }}</button>
          <div class="is-pulled-right">
            <span v-if="registering" class="has-text-color-cns is-size-7 has-text-right">
              {{ $t("cns.message.generating") }}
            </span>
            <button
              :class="{ button: true, 'is-primary': true, 'is-pulled-right': true, 'is-loading': registering }"
              @keyup.enter="register()"
              @click="register()"
            >
              <span v-if="renew">{{ $t("cns.button.renew") }}</span>
              <span v-else>{{ $t("cns.button.register") }}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getPrice, Price, register } from "../../../lib-chia/services/api/cns-register";
import { ResolveFailureAnswer, resolveName, StandardResolveAnswer } from "@/services/api/resolveName";
import { Component, Vue, Watch } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import AddressField from "@/components/Common/AddressField.vue";
import store from "@/store";
import { AccountEntity, CustomCat } from "../../../lib-chia/models/account";
import TakeOffer from "@/components/Offer/Take.vue";
import { getAllCats } from "@/store/modules/account";
import { isMobile } from "@/services/view/responsive";
import { DidDetail, NftDetail } from "../../../lib-chia/services/crypto/receive";
import { DonwloadedNftCollection, NftOffChainMetadata } from "../../../lib-chia/models/nft";
import { getScalarString } from "../../../lib-chia/services/coin/nft";
import utility from "../../../lib-chia/services/crypto/utility";
import { unprefix0x } from "../../../lib-chia/services/coin/condition";
import NftDetailPanel from "@/components/Nft/NftDetailPanel.vue";
import TopBar from "@/components/Common/TopBar.vue";
import { chainId } from "@/store/modules/network";

@Component({
  components: {
    AddressField,
    TopBar,
  },
})
export default class Cns extends Vue {
  public name = "";
  public resolveAns: StandardResolveAnswer | ResolveFailureAnswer | null = null;
  public isResolving = false;
  public showDetail = false;
  public errorMsg = "";
  public showModal = false;
  public address = "";
  public period = 1;
  public price: Price = { name: "", price: -1, annualFee: -1, royaltyPercentage: -1, registrationFee: -1 };
  public registerErrMsg = "";
  public offer = "";
  public registering = false;
  public showMyCns = false;
  public isLoading = false;
  public regYear = 1;
  public showFill = false;
  public showRanking = false;
  public minLength = 6;

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

  get isTestnet(): boolean {
    return window.location.host != process.env.VUE_APP_MAINNET_HOST;
  }

  get unit(): string {
    return this.isTestnet ? "TXCH" : "XCH";
  }

  get renew(): boolean {
    return this.resolveAns?.status == "Found";
  }

  get cnsName(): string {
    return `${this.name.toLocaleLowerCase()}.xch`;
  }

  get cnsUrl(): string {
    return `https://${this.cnsName}.cool`;
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

  getCnsName(address: string): string {
    return this.extraInfo?.[address]?.metadata?.name ?? "";
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
      props: { nft: nft, inputMetadata: this.extraInfo[nft.address].metadata, account: this.account, dids: this.dids },
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
    this.name = this.name.replace(/\s/g, "");
    this.name = this.name.split(".")[0];
    this.resolveAns = await resolveName(`${this.name}.xch`, "whois");
    if (this.resolveAns.status != "Failure") {
      if (this.resolveAns.status == "NotFound") await this.getPrice();
    }

    this.showDetail = true;
    this.isResolving = false;
  }

  async getPrice(): Promise<void> {
    this.price = await getPrice(`${this.name}.xch`, this.regYear, this.renew, chainId());
  }

  async register(): Promise<void> {
    this.registering = true;
    const res = await register(`${this.name}.xch`, this.regYear, this.renew, chainId(), this.address);
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
    this.showDetail = false;
    this.price = { name: "", price: -1, annualFee: -1, royaltyPercentage: -1, registrationFee: -1 };
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

  getStatus(expiry: number): string {
    const expsec = expiry * 1000;

    const now = new Date().getTime();
    if (expsec > now) return "OK";

    // Temporarily extend expiry to 2024-03-14
    // UTC: Mar 14 2024 00:00:00
    if (now < 1710374400000) return "Extended";
    if (expsec < now + 90 * 24 * 60 * 60 * 1000) return "Grace Period";
    return "Releasing";
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

:root.dark-theme {
  .cover {
    object-fit: cover;
    aspect-ratio: 1 / 1;
    width: 100%;
  }
}
</style>
