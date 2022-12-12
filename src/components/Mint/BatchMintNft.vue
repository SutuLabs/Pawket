<template>
  <div class="modal-card" @dragenter="dragenter" @dragleave="dragleave">
    <top-bar :title="$t('batchMintNft.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <template v-if="!bundle">
        <span class="label">
          <b-tooltip :label="$t('batchSend.ui.tooltip.upload')" position="is-right">
            <b-upload v-model="file" accept=".csv" class="file-label" @input="afterUploadCsv">
              <b-tag icon="tray-arrow-up" size="is-small">{{ $t("batchSend.ui.button.upload") }}</b-tag>
            </b-upload>
          </b-tooltip>
          <b-tooltip :label="$t('batchSend.ui.tooltip.help')" position="is-bottom" multilined>
            <b-icon icon="help-circle" size="is-small"> </b-icon>
          </b-tooltip>
          <a @click="fillSample"
            ><span class="is-size-7 is-underlined">{{ $t("batchSend.ui.field.csv.fillSample") }}</span></a
          >
          <span class="is-size-7">{{ $t("batchSend.ui.field.csv.or") }}</span>
          <a :href="csvSampleUri" :download="$t('batchSend.ui.field.csv.sampleName') + '.csv'"
            ><span class="is-size-7 is-underlined">{{ $t("batchSend.ui.field.csv.downloadSample") }}</span></a
          >
        </span>
        <b-field>
          <b-input type="textarea" v-model="csv" v-show="!isDragging"></b-input>
        </b-field>
        <b-field v-show="isDragging">
          <b-upload v-model="dragfile" drag-drop expanded multiple @input="afterDragged">
            <section class="section">
              <div class="content has-text-centered">
                <p>
                  <b-icon icon="upload" size="is-large"> </b-icon>
                </p>
                <p>{{ $t("batchSend.ui.field.csv.drag") }}</p>
              </div>
            </section>
          </b-upload>
        </b-field>
        <b-field>
          <b-tag v-if="file" icon="paperclip" size="is-small" closable aria-close-label="Close tag" @close="deleteFile">
            {{ file.name }}
          </b-tag>
        </b-field>

        <b-field :label="$t('batchMintNft.ui.label.royaltyAddress')">
          <b-input v-model="royaltyAddress" type="text" @input="reset()" required></b-input>
        </b-field>
        <b-field :label="$t('batchMintNft.ui.label.royaltyPercentage')">
          <b-numberinput
            v-model="royaltyPercentage"
            max="100"
            min="0"
            step="0.5"
            min-step="0.01"
            aria-minus-label="Decrement by 0.01"
            aria-plus-label="Increment by 0.01"
          >
          </b-numberinput>
        </b-field>

        <fee-selector v-model="fee"></fee-selector>
      </template>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($tc('batchSend.ui.summary.notification'))"></span>
        </b-notification>
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button v-if="!bundle" :label="$t('common.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button v-if="bundle" :label="$t('common.button.back')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
          v-if="!bundle"
          type="is-primary"
          @click="sign()"
          :loading="submitting"
          :disabled="status == 'Loading' || submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('common.button.submit')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { AccountEntity } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import puzzle from "@/services/crypto/puzzle";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import { csvToArray } from "@/services/util/csv";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { NftMetadataValues } from "@/models/nft";
import { generateMintNftBundle } from "@/services/coin/nft";
import store from "@/store";
import { Hex, prefix0x } from "@/services/coin/condition";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    TopBar,
  },
})
export default class BatchMintNft extends Vue {
  @Prop() public account!: AccountEntity;
  public submitting = false;
  public fee = 0;
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public status: "Loading" | "Loaded" = "Loading";
  public csv = "";
  public file: File | null = null;
  public dragfile: File[] = [];
  public isDragging = false;
  public transitioning = false;
  public royaltyAddress = "";
  public royaltyPercentage = 0;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    this.loadCoins();
    if (!this.account.dids) {
      store.dispatch("refreshDids");
    }
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
    if (this.path.endsWith("batch-mint-nft")) this.$router.back();
    return;
  }

  reset(): void {
    this.bundle = null;
  }

  cancel(): void {
    if (this.bundle) {
      this.reset();
    } else {
      this.close();
    }
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.status = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoins(this.account);
      this.availcoins = coins[0];
    }

    this.status = "Loaded";
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

      const inputs = csvToArray(this.csv);
      const metadatas: NftMetadataValues[] = [];
      const addresses: string[] = [];

      for (let i = 0; i < inputs.length; i++) {
        const line = inputs[i];

        const imageUri = line[0];
        const imageHash = line[1];
        const metadataUri = line[2];
        const metadataHash = line[3];
        const licenseUri = line[4];
        const licenseHash = line[5];
        const serialNumber = Number(line[6]).toString(16);
        const serialTotal = Number(line[7]).toString(16);
        const targetAddress = line[8];
        if (!targetAddress.startsWith(xchPrefix())) {
          Notification.open({
            message: this.$tc("batchSend.messages.error.ADDRESS_NOT_MATCH_NETWORK", 1, { targetAddress }),
            type: "is-danger",
            duration: 5000,
          });
          this.submitting = false;
          return;
        }

        metadatas.push({
          imageUri,
          imageHash,
          metadataUri,
          metadataHash,
          licenseUri,
          licenseHash,
          serialNumber,
          serialTotal,
        });
        addresses.push(targetAddress);
      }
      const observers = await getAssetsRequestObserver(this.account);
      const royaltyAddressHex = puzzle.getPuzzleHashFromAddress(this.royaltyAddress);
      const tradePricePercentage = this.royaltyPercentage * 100;
      const ubundle = await generateMintNftBundle(
        this.account.firstAddress,
        this.account.firstAddress,
        BigInt(this.fee),
        metadatas,
        this.availcoins,
        observers,
        royaltyAddressHex,
        tradePricePercentage,
        networkContext(),
        did.analysis,
        undefined,
        addresses
      );
      this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());
      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
      }
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
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
  }

  get csvSampleUri(): string {
    const address = puzzle.getAddressFromPuzzleHash(
      "d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea",
      xchPrefix()
    );
    const dataPrefix = "data:text/csv;charset=utf-8";
    const fields = `${this.$tc("batchSend.sample.address")},${this.$tc("batchSend.sample.coin")},${this.$tc(
      "batchSend.sample.amount"
    )},${this.$tc("batchSend.sample.memo")}\n`;
    const content = `${dataPrefix},${fields}${address},BSH,150,hello_memo\n${address},${xchSymbol()},150,`;
    return encodeURI(content);
  }

  fillSample(): void {
    const address = puzzle.getAddressFromPuzzleHash(
      "d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea",
      xchPrefix()
    );
    this.csv = `http://localhost:8080/img/logo.d9691df6.svg,B1EA9E8E58A58B5934ED53A780DF5104248DE15918D038D5A697514225861C09,https://ipfs.io/ipfs/QmPmgxY99iMESbgoaajbT8Q8ZJNaPdEUmGnXxatnoeYdY6?filename=metadata.json,3C2FFA61702733906ADD41B309604B2ED6233FDCDD5CA865892F51385828DB18,http://localhost:8080/img/logo.d9691df6.svg,B1EA9E8E58A58B5934ED53A780DF5104248DE15918D038D5A697514225861C09,1,100,xch1yrp82hk8q566lj9zkpqg637rp4r6rnsjxtxdxdusxrp62ymru2eq3l2ger
http://localhost:8080/img/logo.d9691df6.svg,B1EA9E8E58A58B5934ED53A780DF5104248DE15918D038D5A697514225861C09,https://ipfs.io/ipfs/QmUAjv2L1Dh8mNZwvmk5DStAyW2MjVw6hg8Fv4dhwAWChm?filename=metadata.json,9111F0C899611CD8C5EDE9DB816E1E160B9C3D04848EC740F2B155EDAE7C86E7,http://localhost:8080/img/logo.d9691df6.svg,B1EA9E8E58A58B5934ED53A780DF5104248DE15918D038D5A697514225861C09,2,100,xch12kr5c48vs65gugkn448j4djz95xqhxxjm05e0hfp7sze85rvsfns56p70d
http://localhost:8080/img/logo.d9691df6.svg,B1EA9E8E58A58B5934ED53A780DF5104248DE15918D038D5A697514225861C09,https://ipfs.io/ipfs/QmdQ8p2D6XVb1g4nCpA4te2vtzJNvPG9VN8DBPZb6FsQXL?filename=metadata.json,01FC98F2CD06CFCA1CB34F89A843185C13745DAE5ADD6FFC00ACD2CDA5D33C6F,http://localhost:8080/img/logo.d9691df6.svg,B1EA9E8E58A58B5934ED53A780DF5104248DE15918D038D5A697514225861C09,3,100,xch1mh5us8c296g4rvfhf4ksmnwzd66a9tzt9rslf3f4waejhyws7g6slnrxz6`;
    this.royaltyAddress = address;
    this.royaltyPercentage = 4.5;
  }

  async afterUploadCsv(f: File): Promise<void> {
    this.isDragging = false;
    const csvText = await f.text();
    const idx = csvText.search("\n");
    this.csv = csvText.substring(idx + 1);
  }

  deleteFile(): void {
    this.file = null;
    this.csv = "";
  }

  dragenter(event: Event): void {
    event.preventDefault();
    this.isDragging = true;
    this.transitioning = true;
    setTimeout(() => (this.transitioning = false), 1);
  }

  dragleave(event: Event): void {
    event.preventDefault();
    if (!this.transitioning) this.isDragging = false;
  }

  afterDragged(f: File[]): void {
    this.isDragging = false;
    if (f.length > 1) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.onlyOneFile"),
        type: "is-danger",
        autoClose: false,
      });
      this.dragfile = [];
      return;
    }
    if (f[0].type !== "text/csv") {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.wrongFileType"),
        type: "is-danger",
        autoClose: false,
      });
      this.dragfile = [];
      return;
    }
    this.file = f[0];
    this.afterUploadCsv(f[0]);
    this.dragfile = [];
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
.field ::v-deep textarea {
  font-size: 0.9em;
}
</style>
