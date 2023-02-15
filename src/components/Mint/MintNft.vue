<template>
  <confirmation
    :value="bundle"
    :title="$t('mintNft.ui.title')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    @cancel="cancel()"
    @confirm="submit()"
    :signBtn="account.type == 'PublicKey' ? $t('common.button.generate') : 'Create NFT'"
    :showClose="true"
    :loading="submitting"
    :disabled="!did || !validity || submitting"
    :submitting="submitting"
  >
    <template #sign>
      <p v-if="did" class="pb-2">
        <a :href="`https://frodo.coinhabit.net/tutorial/nft${experimentMode?'':'?b=1'}`" target="_blank">
          <b-tag icon="help-circle" size="is-small">Tutorial</b-tag>
        </a>
      </p>
      <div v-if="!did" class="mb-3">
        <p class="help is-size-6 pb-2">
          Please Create a Profile/DID first:
        </p>
        <b-button type="is-primary" expanded @click="addDid()">
          <b-icon icon="plus" size="is-small" class="mr-1"></b-icon>
          {{ $t("did.ui.button.addDid") }}
        </b-button>
      </div>
      <div v-if="did"><address-field
        v-if="experimentMode"
        :inputAddress="address"
        :addressEditable="addressEditable"
        @updateAddress="updateAddress"
        @updateContactName="updateContactName"
      ></address-field>
      <b-field v-if="false" :label="$t('mintNft.ui.label.memo')">
        <b-input maxlength="100" v-model="memo" type="text" @input="reset()" disabled></b-input>
      </b-field>
      <span class="label">
        Content Location (URI)
        <a :href="`https://frodo.coinhabit.net/tutorial/nft${experimentMode?'':'?b=1'}#section-file`" target="_blank">
          <b-tag icon="help-circle" size="is-small">Help / How to upload</b-tag>
        </a>
      </span>
      <b-field>
        <template #message>
          <a v-if="uri" :href="uri" target="_blank">
            <img :src="uri" class="image-preview" />
          </a>
        </template>
        <b-input maxlength="1024" v-model="uri" type="text" @input="reset()" required></b-input>
      </b-field>
      <span class="label">
        {{ $t("mintNft.ui.label.hash") }}
        <b-tooltip :label="$t('mintNft.ui.tooltip.upload')" position="is-bottom" multilined>
          <b-upload v-model="imageFile" class="file-label" @input="afterUploadImg">
            <b-tag icon="tray-arrow-up" size="is-small">{{ $t("mintNft.ui.button.upload") }}</b-tag>
          </b-upload>
        </b-tooltip>
      </span>
      <b-field>
        <b-input maxlength="64" v-model="hash" type="text" @input="reset()" required></b-input>
      </b-field>
      <span class="label">
        Metadata File Location (URI)
        <a :href="`https://frodo.coinhabit.net/create-metadata${experimentMode?'':'?b=1'}`" target="_blank">
          <b-tag icon="help-circle" size="is-small">Help / Create</b-tag>
        </a>
      </span>
      <b-field>
        <b-input v-model="metadataUri" type="text" @input="reset()" required></b-input>
      </b-field>
      <span class="label">
        Metadata File Hash
        <b-tooltip :label="$t('mintNft.ui.tooltip.uploadMetadata')" position="is-bottom" multilined>
          <b-upload v-model="imageFile" class="file-label" @input="afterUploadMetadata">
            <b-tag icon="tray-arrow-up" size="is-small">{{ $t("mintNft.ui.button.upload") }}</b-tag>
          </b-upload>
        </b-tooltip>
      </span>
      <b-field>
        <b-input maxlength="64" v-model="metadataHash" type="text" @input="reset()" required></b-input>
      </b-field>
      <b-field v-if="experimentMode" :label="'License URL'">
        <b-input v-model="licenseUri" type="text" @input="reset()" required></b-input>
      </b-field>
      <b-field v-if="experimentMode" :label="'License Hash'">
        <b-input maxlength="64" v-model="licenseHash" type="text" @input="reset()" required></b-input>
      </b-field>
      <b-field v-if="experimentMode" :label="'Royalty Address'">
        <b-input v-model="royaltyAddress" type="text" @input="reset()" required></b-input>
      </b-field>
      <b-field v-if="experimentMode" :label="'Royalty Percentage'">
        <b-input max="100" min="0" v-model="royaltyPercentage" type="number" @input="reset()" required></b-input>
      </b-field>
      <b-field v-if="experimentMode" :label="'Series Number'">
        <b-numberinput min="0" v-model="serialNumber" @input="reset()" required></b-numberinput>
      </b-field>
      <b-field v-if="experimentMode" :label="'Series Total'">
        <b-numberinput min="0" v-model="serialTotal" @input="reset()" required></b-numberinput>
      </b-field>
      <fee-selector v-if="experimentMode" v-model="fee" @input="changeFee()"></fee-selector></div>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('mintNft.ui.summary.notification'))"></span>
      </b-notification>
      <send-summary
        :nftUri="uri"
        :nftHash="hash"
        :fee="feeBigInt"
        :address="address"
        :leadingText="$t('mintNft.ui.summary.label.leadingText')"
        :total="total"
        :contactName="contactName"
      ></send-summary>
      <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
    </template>
    <template #extraBtn>
      <div v-if="showTest && debugMode">
        <b-button
          v-for="(c, idx) in testCases"
          :key="idx"
          type="is-primary is-light"
          size="is-small"
          :title="c.tip"
          @click="setCase(c.info)"
        >
          <span>{{ c.name }}</span>
        </b-button>
      </div>
      <button v-if="debugMode" class="test-btn" @click="showTest = !showTest"></button>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { AccountEntity, TokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import bigDecimal from "js-big-decimal";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { ensureAddress, networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getTokenInfo } from "@/services/view/cat";
import { DidDetail } from "@/services/crypto/receive";
import AddressField from "@/components/Common/AddressField.vue";
import { Bytes } from "clvm";
import { bech32m } from "@scure/base";
import utility from "@/services/crypto/utility";
import { generateMintNftBundle } from "@/services/coin/nft";
import { NftMetadataValues } from "@/models/nft";
import puzzle from "@/services/crypto/puzzle";
import Confirmation from "../Common/Confirmation.vue";
import { Hex, prefix0x } from "@/services/coin/condition";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import { isMobile } from "@/services/view/responsive";
import MintDid from "@/components/Mint/MintDid.vue";

interface NftFormInfo {
  uri: string;
  hash: string;
  metadataUri: string;
  metadataHash: string;
  licenseUri: string;
  licenseHash: string;
  royaltyAddress: string;
  royaltyPercentage: number;
  serialNumber: number;
  serialTotal: number;
}

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    AddressField,
    Confirmation,
  },
})
export default class MintNft extends Vue {
  @Prop() public account!: AccountEntity;
  public addressEditable = true;
  public submitting = false;
  public fee = 0;
  public address = "";
  public contactName = "";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectedToken = xchSymbol();
  public validity = false;
  public imageFile: File | null = null;

  public uri = "";
  public hash = "";
  public metadataUri = "";
  public metadataHash = "";
  public licenseUri = "";
  public licenseHash = "";
  public royaltyAddress = "";
  public royaltyPercentage = 3;
  public serialNumber = 1;
  public serialTotal = 1;

  public requests: TokenPuzzleDetail[] = [];

  public showTest = false;
  public testCases = [
    {
      name: "1",
      tip: "temp case",
      info: {
        uri: "https://ipfs.io/ipfs/Qmf4AyDewBSyAAqjy52CN9sW86Wx33pxGLsX4PaSVdJMvG",
        hash: "21abefc9338c4d94a7d29c4c4d91ebd12b34549053e4d0bef8d9a052f6836b7c",
        metadataUri: "https://ipfs.io/ipfs/QmcvzMotNFbcCPnJodHZL2G38NFvQtBkHUcMKQcmHWbkGV",
        metadataHash: "ba6f6c49c2e19c533b5feffa004f2acd8e776fe35b95337a39d801da711153f6",
        licenseUri: "https://bafybeigzcazxeu7epmm4vtkuadrvysv74lbzzbl2evphtae6k57yhgynp4.ipfs.nftstorage.link/license.pdf",
        licenseHash: "2267456bd2cef8ebc2f22a42947b068bc3b138284a587feda2edfe07a3577f50",
        royaltyAddress: "xch1p6mjpkgetll9j6ztv2cj64rer0n66wakypl4awfwpcd5pm9uz92szpcen7",
        royaltyPercentage: 5,
        serialNumber: 3,
        serialTotal: 100,
      },
    },
  ];

  mounted(): void {
    this.loadCoins();
    this.address = ensureAddress(this.account.firstAddress);
    this.royaltyAddress = ensureAddress(this.account.firstAddress);
    store.dispatch("refreshDids");
  }

  get did(): DidDetail | undefined {
    return this.account.dids ? this.account.dids[0] : undefined;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  @Emit("close")
  close(): void {
    if (this.path.endsWith("mint-nft")) this.$router.back();
    return;
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  get symbol(): string {
    return xchSymbol();
  }

  get feeBigInt(): bigint {
    return BigInt(this.fee);
  }

  get total(): bigint {
    return this.feeBigInt + 1n;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  async afterUploadImg(f: File): Promise<void> {
    const hash = await utility.getFileHash(f);
    this.hash = hash;
  }

  async afterUploadMetadata(f: File): Promise<void> {
    const hash = await utility.getFileHash(f);
    this.metadataHash = hash;
  }
  
  reset(): void {
    this.bundle = null;
  }

  updateAddress(value: string): void {
    this.address = value;
    this.reset();
  }

  updateContactName(value: string): void {
    this.contactName = value;
  }

  cancel(): void {
    if (this.bundle) {
      this.reset();
    } else {
      this.$router.back();
    }
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  changeToken(token: string): void {
    this.selectedToken = token;
    if (this.selectedToken == xchSymbol()) {
      this.memo = "";
    }
    this.reset();
    this.loadCoins();
  }

  changeValidity(valid: boolean): void {
    this.validity = valid;
    this.reset();
  }

  setCase(info: NftFormInfo): void {
    this.uri = info.uri;
    this.hash = info.hash;
    this.metadataUri = info.metadataUri;
    this.metadataHash = info.metadataHash;
    this.licenseUri = info.licenseUri;
    this.licenseHash = info.licenseHash;
    this.royaltyAddress = info.royaltyAddress;
    this.royaltyPercentage = info.royaltyPercentage;
    this.serialNumber = info.serialNumber;
    this.serialTotal = info.serialTotal;
  }

  addDid(): void {
    this.$buefy.modal.open({
      parent: this,
      component: MintDid,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { account: this.account },
    });
  }
  
  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.maxAmount = "-1";
    this.totalAmount = "-1";
    this.maxStatus = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoins(this.account);
      this.availcoins = coins[0];
    }

    if (!this.availcoins || !this.availcoins[this.selectedToken]) {
      return;
    }

    const availcoins = this.availcoins[this.selectedToken].map((_) => _.amount);

    this.totalAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );
    const singleMax = bigDecimal.divide(
      availcoins.reduce((a, b) => (a > b ? a : b), 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );
    if (this.selectedToken == xchSymbol()) {
      this.maxAmount = this.totalAmount;
      this.totalAmount = "-1";
    } else {
      this.maxAmount = singleMax;
    }
    this.maxStatus = "Loaded";

    this.changeValidity(true);
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (!this.account.firstAddress) {
        this.submitting = false;
        return;
      }

      if (this.availcoins == null) {
        this.submitting = false;
        return;
      }

      try {
        Bytes.from(bech32m.decodeToBytes(this.address).bytes).hex();
      } catch (error) {
        Notification.open({
          message: this.$tc("send.messages.error.INVALID_ADDRESS"),
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      if (!this.address.startsWith(xchPrefix())) {
        Notification.open({
          message: this.$tc("send.messages.error.ADDRESS_NOT_MATCH_NETWORK"),
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const did = this.account.dids ? this.account.dids[0] : undefined;
      if (!did) {
        Notification.open({
          message: "At least one DID is needed.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const md: NftMetadataValues = {
        imageUri: this.uri,
        imageHash: this.hash,
        licenseUri: this.licenseUri,
        licenseHash: this.licenseHash,
        metadataUri: this.metadataUri,
        metadataHash: this.metadataHash,
        serialNumber: Math.floor(this.serialNumber).toString(16),
        serialTotal: Math.floor(this.serialTotal).toString(16),
      };

      const observers = await getAssetsRequestObserver(this.account);
      const ubundle = await generateMintNftBundle(
        this.address,
        this.account.firstAddress,
        BigInt(this.fee),
        md,
        this.availcoins,
        observers,
        puzzle.getPuzzleHashFromAddress(this.royaltyAddress),
        this.royaltyPercentage * 100,
        networkContext(),
        did.analysis,
        undefined,
        undefined
      );

      this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());

      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
      }
    } catch (error) {
      Notification.open({
        message: this.$tc("mintNft.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.submitting = false;
    }
    this.submitting = false;
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.close);

    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  changeFee(): void {
    this.reset();
  }

  async offlineSignBundle(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Offline/OfflineSpendBundleQr.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { bundle: this.bundle, mode: "ONLINE_CLIENT" },
      events: {
        signature: (sig: Hex): void => {
          if (this.bundle) this.bundle.aggregated_signature = prefix0x(sig);
        },
      },
    });
  }
}
</script>

<style scoped lang="scss">
img.image-preview {
  width: 50%;
  height: 3rem;
  object-fit: cover;
  border: 1px solid;
}
.test-btn {
  background-color: transparent;
  background-repeat: no-repeat;
  border: none;
  cursor: initial;
  overflow: hidden;
  outline: none;
  min-width: 80px;
  min-height: 35px;
}
</style>
