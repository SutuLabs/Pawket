<template>
  <div class="modal-card">
    <top-bar :title="$t('scanAssets.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body" v-if="mode == 'option'">
      <div class="is-size-6 has-text-info">
        {{ $t("scanAssets.ui.prompt.selectAssetType") }}
      </div>
      <div class="pt-4">
        <b-field :label="$t('scanAssets.ui.label.scan')">
          <b-radio v-model="option" native-value="Token"> {{ $t("scanAssets.ui.label.token") }} </b-radio>
        </b-field>
        <b-field>
          <b-select v-model="token" expanded :disabled="option != 'Token'">
            <option v-for="token in tokenNames" :key="token" :value="token">
              {{ token }}
            </option>
          </b-select>
        </b-field>
        <b-field>
          <b-radio v-model="option" native-value="NftV1"> {{ $t("scanAssets.ui.label.nft") }} </b-radio>
        </b-field>
        <b-field>
          <b-radio v-model="option" native-value="DidV1"> {{ $t("scanAssets.ui.label.did") }} </b-radio>
        </b-field>
        <b-field>
          <b-radio v-model="option" native-value="CatV2"> {{ $t("scanAssets.ui.label.myCats") }}</b-radio>
        </b-field>
        <b-field :label="$t('scanAssets.ui.label.maxAddress')">
          <b-select v-model="addressNumber" expanded>
            <option v-for="number in addressNumberOptions" :key="number" :value="number">
              {{ number }}
            </option>
          </b-select>
        </b-field>
      </div>
    </section>
    <section class="modal-card-body" v-if="mode == 'result'">
      <div v-if="status == 'Scanning'">
        <div class="is-size-6 has-text-info">{{ $t("scanAssets.ui.prompt.scanning") }}</div>
        <div class="is-size-6 has-text-info">{{ $t("scanAssets.ui.prompt.wait") }}</div>
      </div>
      <div class="pt-3">
        <b-field :label="$t('scanAssets.ui.label.scanning')" class="mb-1">
          <b-progress size="is-large" type="is-primary" :value="progress"></b-progress>
        </b-field>
        <div class="pb-2">
          <div class="is-size-6" v-if="status == 'Scanning'">
            {{ $t("scanAssets.ui.prompt.scanned") }} {{ current }}/{{ addressNumber }}
          </div>
          <div class="is-size-6" v-if="status == 'Finished'">{{ $t("scanAssets.ui.prompt.finished") }}</div>
          <div class="is-size-6" v-if="status == 'Canceled'">{{ $t("scanAssets.ui.prompt.canceled") }}</div>
          <div class="is-size-6" v-if="status == 'Paused'">{{ $t("scanAssets.ui.prompt.paused") }}</div>
        </div>
        <div class="buttons pt-4">
          <b-button type="is-info" outlined v-if="status == 'Scanning'" @click="pause()">{{
            $t("scanAssets.ui.button.pause")
          }}</b-button>
          <b-button type="is-info" outlined v-if="status == 'Paused'" @click="start()">{{
            $t("scanAssets.ui.button.continue")
          }}</b-button>
          <b-button type="is-info" outlined v-if="status == 'Finished' || status == 'Canceled'" @click="reScan()">{{
            $t("scanAssets.ui.button.reScan")
          }}</b-button>
          <b-button v-if="status == 'Scanning' || status == 'Paused'" @click="cancel()">{{
            $t("scanAssets.ui.button.cancel")
          }}</b-button>
        </div>
      </div>
      <div class="pt-6">
        <b-field>
          <template #label>
            {{ $t("scanAssets.ui.label.result") }}
            <b-button loading size="is-small" rounded v-if="isLoading" type="is-text"></b-button>
          </template>
          <table class="table is-fullwidth has-text-centered">
            <thead>
              <tr>
                <th>{{ $t("scanAssets.ui.label.name") }}</th>
                <th v-if="option == 'Token'">{{ $t("scanAssets.ui.label.balance") }}</th>
                <th>{{ $t("scanAssets.ui.label.id") }}</th>
                <th>{{ $t("scanAssets.ui.label.action") }}</th>
              </tr>
            </thead>
            <tbody v-if="option == 'Token'">
              <tr v-if="tokenBalance[token]">
                <td>{{ token }}</td>
                <td>{{ demojo(tokenBalance[token].amount, tokenInfo[token]) }}</td>
                <td>{{ token == "XCH" ? "Orignal Coin" : shorten(catIds[token]) }}</td>
                <td>
                  <b-button type="is-primary" size="is-small" outlined @click="send()" :disabled="status == 'Scanning'">{{
                    $t("scanAssets.ui.button.send")
                  }}</b-button>
                </td>
              </tr>
            </tbody>
            <tbody v-if="option == 'NftV1'">
              <tr v-for="(nft, index) of nftList" :key="index">
                <td>
                  <span class="image is-32x32">
                    <img :src="nft.metadata.uri" />
                  </span>
                </td>
                <td>
                  <key-box :value="nft.address" :showValue="true"></key-box>
                </td>
                <td>
                  <b-button
                    type="is-primary"
                    size="is-small"
                    outlined
                    @click="transfer(nft)"
                    :disabled="status == 'Scanning' && isLoading"
                    :loading="isLoading"
                    >{{ $t("scanAssets.ui.button.send") }}</b-button
                  >
                </td>
              </tr>
            </tbody>
            <tbody v-if="option == 'DidV1'">
              <tr v-for="(did, index) of didList" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <key-box :value="did.did" :showValue="true"></key-box>
                </td>
                <td>
                  <b-button
                    type="is-primary"
                    size="is-small"
                    outlined
                    :disabled="status == 'Scanning' && isLoading"
                    :loading="isLoading"
                    @click="openSignMessage(did.analysis)"
                    >{{ $t("scanAssets.ui.button.sign") }}</b-button
                  >
                </td>
              </tr>
            </tbody>
            <tbody v-if="option == 'CatV2'">
              <tr v-for="(cat, index) of catList" :key="index">
                <td>
                  {{ getCatName(cat.tailProgramHash) }}
                  <b-tag v-if="isImported(unprefix0x(cat.tailProgramHash))">{{ $t("scanAssets.ui.label.imported") }}</b-tag>
                </td>
                <td><key-box :value="unprefix0x(cat.tailProgramHash)" :showValue="true"></key-box></td>
                <td v-if="!isImported(unprefix0x(cat.tailProgramHash))">
                  <b-button
                    type="is-primary"
                    size="is-small"
                    outlined
                    @click="add(unprefix0x(cat.tailProgramHash))"
                    :disabled="status == 'Scanning' && isLoading"
                    :loading="isLoading"
                    >{{ $t("scanAssets.ui.button.add") }}</b-button
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </b-field>
      </div>
    </section>
    <footer class="is-block buttons modal-card-foot pb-2 my-0" v-if="mode == 'option'">
      <b-button class="is-pulled-right" type="is-primary" @click="start()">{{ $t("scanAssets.ui.button.start") }}</b-button>
    </footer>
  </div>
</template>
<script lang="ts">
import { AccountEntity, AccountTokens, CustomCat, OneTokenInfo, TokenInfo } from "@/models/account";
import { getCatIdDict, getCatNames, getTokenInfo } from "@/services/view/cat";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import receive, { DidDetail, NftDetail, TokenPuzzleObserver } from "@/services/crypto/receive";
import { ensureAddress, rpcUrl, xchPrefix, xchSymbol } from "@/store/modules/network";
import { CoinRecord, GetRecordsResponse } from "@/models/wallet";
import debug from "@/services/api/debug";
import { analyzeNftCoin, getScalarString } from "@/services/coin/nft";
import puzzle, { PuzzleObserver } from "@/services/crypto/puzzle";
import { analyzeCatCoin, CatCoinAnalysisResult } from "@/services/coin/cat";
import utility from "@/services/crypto/utility";
import { demojo } from "@/filters/unitConversion";
import TailDb, { TailInfo } from "@/services/api/tailDb";
import { shorten } from "@/filters/addressConversion";
import ManageCats from "../Cat/ManageCats.vue";
import NftTransfer from "../Nft/NftTransfer.vue";
import { isMobile } from "@/services/view/responsive";
import { unprefix0x } from "@/services/coin/condition";
import coin from "@/services/transfer/coin";
import Send from "../Send/Send.vue";
import { getAllCats } from "@/store/modules/account";
import { NotificationProgrammatic as Notification } from "buefy";
import store from "@/store";
import { analyzeDidCoin, DidCoinAnalysisResult } from "@/services/coin/did";
import KeyBox from "../Common/KeyBox.vue";
import SignMessage from "../Cryptography/SignMessage.vue";
import { convertToOriginCoin } from "@/services/coin/coinUtility";
import TopBar from "../Common/TopBar.vue";

type Option = "Token" | "NftV1" | "CatV2" | "DidV1";
type Mode = "option" | "result";
type Status = "Configuring" | "Scanning" | "Paused" | "Canceled" | "Finished";
const unknownCat = "Unknown CAT";

@Component({ components: { KeyBox, TopBar } })
export default class ScanAssets extends Vue {
  @Prop() public account!: AccountEntity;
  option: Option = "Token";
  mode: Mode = "option";
  status: Status = "Configuring";
  token = "XCH";
  addressNumber = 100;
  current = 0;
  tails: TailInfo[] = [];
  addressNumberOptions = [100, 500, 1000];
  nftList: NftDetail[] = [];
  didList: DidDetail[] = [];
  catList: CatCoinAnalysisResult[] = [];
  tokenBalance: AccountTokens = {};
  allRequests: TokenPuzzleObserver[] = [];
  puzCache: { [symbol: string]: PuzzleObserver[] } = {};
  allRecords: CoinRecord[] = [];
  isLoading = false;

  async mounted(): Promise<void> {
    this.tails = await TailDb.getTails();
  }

  close(): void {
    if (this.status == "Scanning") {
      this.$buefy.dialog.confirm({
        message: this.$tc("scanAssets.message.confirmation.close"),
        confirmText: this.$tc("common.button.confirm"),
        cancelText: this.$tc("common.button.cancel"),
        onConfirm: () => {
          this.status = "Canceled";
          if (this.path.endsWith("scan-assets")) this.$router.back();
          this.$emit("close");
        },
      });
    } else {
      this.status = "Canceled";
      if (this.path.endsWith("scan-assets")) this.$router.back();
      this.$emit("close");
    }
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    if (this.path.endsWith("scan-assets")) this.$router.back();
    this.$emit("close");
  }

  pause(): void {
    this.status = "Paused";
  }

  cancel(): void {
    if (this.status == "Scanning") {
      this.$buefy.dialog.confirm({
        message: this.$tc("scanAssets.message.confirmation.cancel"),
        confirmText: this.$tc("common.button.confirm"),
        cancelText: this.$tc("common.button.cancel"),
        onConfirm: () => {
          this.status = "Canceled";
        },
      });
    } else {
      this.status = "Canceled";
    }
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  getCatName(hash: string): string {
    const idx = this.tails.findIndex((t) => t.hash == unprefix0x(hash));
    if (idx > -1) return this.tails[idx].code;
    return unknownCat;
  }

  getCatImg(hash: string): string {
    const idx = this.tails.findIndex((t) => t.hash == unprefix0x(hash));
    if (idx > -1) return this.tails[idx].logo_url;
    return "";
  }

  unprefix0x(str: string | undefined): string {
    return unprefix0x(str);
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  get allCats(): CustomCat[] {
    return getAllCats(this.account);
  }

  isImported(id: string): boolean {
    return this.allCats.findIndex((a) => a.id === id) > -1;
  }

  get tokenNames(): string[] {
    return getCatNames(this.account);
  }

  get progress(): number {
    return (this.current / this.addressNumber) * 100;
  }

  get catIds(): { [name: string]: string } {
    return getCatIdDict(this.account);
  }

  shorten(name: string): string {
    return shorten(name);
  }

  reScan(): void {
    this.reset();
    this.mode = "option";
  }

  reset(): void {
    this.nftList = [];
    this.catList = [];
    this.didList = [];
    this.tokenBalance = {};
    this.allRecords = [];
    this.allRequests = [];
    this.current = 0;
    this.status = "Configuring";
  }

  start(): void {
    this.mode = "result";
    this.status = "Scanning";
    setTimeout(() => {
      this.scan();
    }, 50);
  }

  async scan(): Promise<void> {
    try {
      let symbol = xchSymbol();
      const prefix = xchPrefix();
      let requests: TokenPuzzleObserver[] = [];
      let ps: PuzzleObserver[] = [];
      if (this.option == "Token" && this.token != "XCH") {
        if (this.puzCache[this.token] && this.puzCache[this.token].length >= 2 * (this.current + 100)) {
          ps = this.puzCache[this.token].slice(this.current, this.current + 200);
        } else {
          ps =
            this.account.type == "PublicKey"
              ? await puzzle.getCatPuzzleObservers(
                  utility.fromHexString(this.account.key.publicKey),
                  this.catIds[this.token],
                  prefix,
                  this.current,
                  this.current + 100,
                  "cat_v2"
                )
              : await puzzle.getCatPuzzleDetails(
                  utility.fromHexString(this.account.key.privateKey),
                  this.catIds[this.token],
                  prefix,
                  this.current,
                  this.current + 100,
                  "cat_v2"
                );
          this.puzCache[this.token] = this.puzCache[this.token] ? this.puzCache[this.token].concat(ps) : ps;
        }
        symbol = this.token;
      } else {
        if (this.puzCache["XCH"] && this.puzCache["XCH"].length >= 2 * (this.current + 100)) {
          ps = this.puzCache["XCH"].slice(this.current, this.current + 200);
        } else {
          ps =
            this.account.type == "PublicKey"
              ? await puzzle.getPuzzleObservers(
                  utility.fromHexString(this.account.key.publicKey),
                  prefix,
                  this.current,
                  this.current + 100
                )
              : await puzzle.getPuzzleDetails(
                  utility.fromHexString(this.account.key.privateKey),
                  prefix,
                  this.current,
                  this.current + 100
                );
          this.puzCache["XCH"] = this.puzCache["XCH"] ? this.puzCache["XCH"].concat(ps) : ps;
        }
      }
      requests = [{ symbol: symbol, puzzles: ps }];
      let records;
      if (this.option == "Token") {
        records = await receive.getCoinRecords(requests, false, rpcUrl());
        this.allRecords = this.allRecords.concat(receive.convertActivities(requests, records));
        this.allRequests = this.allRequests.concat(requests);
        const tokenBalance = receive.getTokenBalance(requests, records);
        if (this.tokenBalance[this.token]) {
          this.tokenBalance[this.token] = {
            addresses: this.tokenBalance[this.token].addresses.concat(tokenBalance[this.token].addresses),
            amount: (this.tokenBalance[this.token].amount += tokenBalance[this.token].amount),
          };
        } else {
          this.tokenBalance = tokenBalance;
        }
      } else {
        records = await receive.getCoinRecords(requests, false, rpcUrl(), false, this.option);
        this.allRequests = this.allRequests.concat(requests);
        this.analyse(records, rpcUrl());
      }
    } catch (error) {
      if (error) {
        this.status = "Canceled";
        const err = String(error);
        if (err.match(/OOM/)) {
          Notification.open({
            message: this.$tc("scanAssets.message.error.ABORT_OOM"),
            type: "is-danger",
            duration: 5000,
          });
          return;
        }
        if (err.match(/NETWORK_ERROR/) || err.match(/Failed to fetch/)) {
          Notification.open({
            message: this.$tc("scanAssets.message.error.NETWORK_ERROR"),
            type: "is-danger",
            duration: 5000,
          });
          return;
        }
        Notification.open({
          message: this.$tc("scanAssets.message.error.UNKNOWN"),
          type: "is-danger",
          duration: 5000,
        });
      }
    }
    this.current += 100;
    if (this.current < this.addressNumber && this.status == "Scanning") {
      setTimeout(() => {
        this.scan();
      }, 5000);
    } else {
      if (this.current >= this.addressNumber) this.status = "Finished";
    }
  }

  async analyse(records: GetRecordsResponse, rpcUrl: string): Promise<void> {
    this.isLoading = true;
    for (let i = 0; i < records.coins.length; i++) {
      const coinRecords = records.coins[i];

      for (let j = 0; j < coinRecords.records.length; j++) {
        const coinRecord = coinRecords.records[j];

        if (!coinRecord.coin?.parentCoinInfo) {
          console.warn("coin cannot record", coinRecord);
          continue;
        }

        const scoin = await debug.getCoinSolution(coinRecord.coin.parentCoinInfo, rpcUrl);
        const ocoin = convertToOriginCoin(coinRecord.coin);

        if (this.option == "NftV1") {
          const nftResult = await analyzeNftCoin(scoin.puzzle_reveal, coinRecords.puzzleHash, ocoin, scoin.solution);
          if (nftResult) {
            const nft: NftDetail = {
              metadata: {
                uri: getScalarString(nftResult.metadata.imageUri) ?? "",
                hash: nftResult.metadata.imageHash ?? "",
              },
              hintPuzzle: coinRecords.puzzleHash,
              address: puzzle.getAddressFromPuzzleHash(nftResult.launcherId, "nft"),
              coin: convertToOriginCoin(coinRecord.coin),
              analysis: nftResult,
            };
            if (this.nftList.findIndex((n) => n.address == nft.address) == -1) this.nftList.push(nft);
          }
        }
        if (this.option == "DidV1") {
          const didResult = await analyzeDidCoin(scoin.puzzle_reveal, coinRecords.puzzleHash, ocoin, scoin.solution);
          if (didResult) {
            const did: DidDetail = {
              name: puzzle.getAddressFromPuzzleHash(didResult.launcherId, "did:chia:"),
              did: puzzle.getAddressFromPuzzleHash(didResult.launcherId, "did:chia:"),
              hintPuzzle: coinRecords.puzzleHash,
              coin: convertToOriginCoin(coinRecord.coin),
              analysis: didResult,
            };
            if (this.didList.findIndex((d) => d.did == did.did) == -1) this.didList.push(did);
          }
        }
        if (this.option == "CatV2") {
          const catResult = await analyzeCatCoin(scoin.puzzle_reveal);
          if (catResult) {
            if (this.catList.findIndex((c) => c.tailProgramHash == catResult.tailProgramHash) == -1) this.catList.push(catResult);
          }
        }
      }
    }
    this.isLoading = false;
  }

  add(id: string): void {
    if (this.getCatName(id) !== unknownCat) {
      const network = store.state.network.networkId;
      this.account.allCats.push({ name: this.getCatName(id), id: id, network: network, img: this.getCatImg(id) });
      setTimeout(() => {
        store.dispatch("persistent");
        this.account.addressGenerated = 0;
        store.dispatch("refreshBalance");
      }, 50);
    } else {
      this.$buefy.modal.open({
        parent: this,
        component: ManageCats,
        hasModalCard: true,
        trapFocus: true,
        canCancel: [""],
        props: { account: this.account, defaultName: this.getCatName(id), defaultAssetId: id, defaultTab: 1 },
      });
    }
  }

  send(): void {
    const coins = coin.getAvailableCoinFromRecords(this.account, this.allRequests, this.allRecords, [this.token]);
    const availableCoins = coins[0];
    const allCoins = coins[1];
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: {
        account: this.account,
        inputAddress: ensureAddress(this.account.firstAddress),
        inputAvailableCoins: availableCoins,
        inputAllCoins: allCoins,
        inputRequests: this.allRequests,
        inputSelectedToken: this.token,
      },
    });
  }

  async transfer(nft: NftDetail): Promise<void> {
    const availableCoins = (await coin.getAvailableCoins(this.account, this.allRequests, [this.token]))[0];
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { nft: nft, account: this.account, inputAvailableCoins: availableCoins, inputRequests: this.allRequests },
    });
  }

  openSignMessage(analysis: DidCoinAnalysisResult): void {
    this.$buefy.modal.open({
      parent: this,
      component: SignMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        did: analysis,
        requests: this.allRequests.find((_) => _.symbol == xchSymbol())?.puzzles,
      },
    });
  }
}
</script>
<style lang="scss"></style>
