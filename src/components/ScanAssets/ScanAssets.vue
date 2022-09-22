<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("scanAssets.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body" v-if="mode == 'option'">
      <div class="is-size-6 has-text-info">
        You can scan more addresses to find your XCH, CAT and NFT that are not displayed in the list. And collect them into a
        common address for easy management.
      </div>
      <div>
        <b-field label="Scan">
          <b-radio v-model="option" native-value="Token"> Token </b-radio>
        </b-field>
        <b-field>
          <b-select v-model="token" expanded :disabled="option != 'Token'">
            <option v-for="token in tokenNames" :key="token" :value="token">
              {{ token }}
            </option>
          </b-select>
        </b-field>
        <b-field>
          <b-radio v-model="option" native-value="NftV1"> NFT </b-radio>
        </b-field>
        <b-field>
          <b-radio v-model="option" native-value="CatV2"> My CATs </b-radio>
        </b-field>
        <b-field label="Maximum number of scan addresses">
          <b-select v-model="addressNumber" expanded>
            <option v-for="number in addressNumberOptions" :key="number" :value="number">
              {{ number }}
            </option>
          </b-select>
        </b-field>
      </div>
    </section>
    <section class="modal-card-body" v-if="mode == 'result'">
      <div class="is-size-6 has-text-info">Scanning...</div>
      <div class="is-size-6 has-text-info">for Please be patient for a few minutes.</div>
      <div>
        <b-field label="Scanning">
          <b-progress size="is-large" type="is-primary" :value="progress"></b-progress>
        </b-field>
        <div class="is-size-6" v-if="status == 'Scanning'">Scanned: {{ current }}/{{ addressNumber }}</div>
        <div class="is-size-6" v-if="status == 'Finished'">Finished!</div>
        <div class="is-size-6" v-if="status == 'Canceled'">Canceled.</div>
        <div class="is-size-6" v-if="status == 'Paused'">Paused..</div>
        <div class="buttons">
          <b-button type="is-info" outlined v-if="status == 'Scanning'" @click="pause()">Pause</b-button>
          <b-button type="is-info" outlined v-if="status == 'Paused'" @click="start()">Continue</b-button>
          <b-button type="is-info" outlined v-if="status == 'Finished' || status == 'Canceled'" @click="start()">Rescan</b-button>
          <b-button v-if="status == 'Scanning' || status == 'Paused'" @click="cancel()">Cancel</b-button>
        </div>
      </div>
      <div>
        <b-field label="Result">
          <table class="table is-fullwidth has-text-centered">
            <thead>
              <tr>
                <th>Name</th>
                <th v-if="option == 'Token'">Balance</th>
                <th>ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody v-if="option == 'Token'">
              <tr v-if="current">
                <td>{{ token }}</td>
                <td>{{ demojo(tokenBalance[token].amount, tokenInfo[token]) }}</td>
                <td>{{ token == "XCH" ? "Orignal Coin" : shorten(catIds[token]) }}</td>
                <td><b-button type="is-primary" size="is-small" outlined>Send</b-button></td>
              </tr>
            </tbody>
            <tbody v-if="option == 'NftV1'">
              <tr v-for="(nft, index) of nftList" :key="index">
                <td>
                  <span class="image is-32x32">
                    <img :src="nft.metadata.uri" />
                  </span>
                </td>
                <td>{{ shorten(nft.address) }}</td>
                <td><b-button type="is-primary" size="is-small" outlined @click="transfer(nft)">Send</b-button></td>
              </tr>
            </tbody>
            <tbody v-if="option == 'CatV2'">
              <tr v-for="(cat, index) of catList" :key="index">
                <td>{{ getCatName(cat.tailProgramHash) }}</td>
                <td>{{ shorten(cat.tailProgramHash.slice(2)) }}</td>
                <td>
                  <b-button type="is-primary" size="is-small" outlined @click="Add(cat.tailProgramHash)">Add</b-button>
                </td>
              </tr>
            </tbody>
          </table>
        </b-field>
      </div>
    </section>
    <footer class="is-block buttons modal-card-foot pb-2 my-0" v-if="mode == 'option'">
      <b-button class="is-pulled-right" type="is-primary" @click="start()">Start Scan</b-button>
    </footer>
  </div>
</template>
<script lang="ts">
import { AccountEntity, AccountTokens, OneTokenInfo, TokenInfo } from "@/models/account";
import { getCatIdDict, getCatNames, getTokenInfo } from "@/services/view/cat";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import receive, { NftDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import { rpcUrl, xchPrefix, xchSymbol } from "@/store/modules/network";
import { convertToOriginCoin, GetRecordsResponse } from "@/models/wallet";
import debug from "@/services/api/debug";
import { analyzeNftCoin, getScalarString } from "@/services/coin/nft";
import puzzle, { PuzzleDetail } from "@/services/crypto/puzzle";
import { analyzeCatCoin, CatCoinAnalysisResult } from "@/services/coin/cat";
import utility from "@/services/crypto/utility";
import { demojo } from "@/filters/unitConversion";
import TailDb, { TailInfo } from "@/services/api/tailDb";
import { shorten } from "@/filters/addressConversion";
import ManageCats from "../Cat/ManageCats.vue";
import NftTransfer from "../Nft/NftTransfer.vue";
import { isMobile } from "@/services/view/responsive";

type Option = "Token" | "NftV1" | "CatV2";
type Mode = "option" | "result";
type Status = "Scanning" | "Paused" | "Canceled" | "Finished";
@Component({})
export default class ScanAssets extends Vue {
  @Prop() public account!: AccountEntity;
  option: Option = "Token";
  mode: Mode = "option";
  status: Status = "Scanning";
  token = "XCH";
  addressNumber = 100;
  current = 0;
  tails: TailInfo[] = [];
  addressNumberOptions = [100, 500, 1000, 1500, 2000];
  nftList: NftDetail[] = [];
  catList: CatCoinAnalysisResult[] = [];
  tokenBalance: AccountTokens = {};

  async mounted(): Promise<void> {
    this.tails = await TailDb.getTails();
  }

  @Emit("close")
  close(): void {
    if (this.path.endsWith("scan-assets")) this.$router.back();
    return;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  pause(): void {
    this.status = "Paused";
  }

  cancel(): void {
    this.status = "Canceled";
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  getCatName(hash: string): string {
    const idx = this.tails.findIndex((t) => t.hash == hash.slice(2));
    if (idx > -1) return this.tails[idx].code;
    return "Unknown CAT";
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
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

  start(): void {
    this.mode = "result";
    if (this.status == "Finished" || this.status == "Canceled") {
      this.nftList = [];
      this.catList = [];
      this.tokenBalance = {};
      this.current = 0;
    }
    this.status = "Scanning";
    this.scan();
  }

  async scan(): Promise<void> {
    try {
      const privatekey = utility.fromHexString(this.account.key.privateKey);
      let symbol = xchSymbol();
      const prefix = xchPrefix();
      let requests: TokenPuzzleDetail[] = [];
      let ps: PuzzleDetail[] = [];
      if (this.option == "Token" && this.token != "XCH") {
        ps = await puzzle.getCatPuzzleDetails(
          privatekey,
          this.catIds[this.token],
          prefix,
          this.current,
          this.current + 100,
          "cat_v2"
        );
        symbol = this.token;
      } else {
        ps = await puzzle.getPuzzleDetails(privatekey, prefix, this.current, this.current + 100);
      }
      requests = [{ symbol: symbol, puzzles: ps }];
      let records;
      if (this.option == "Token") {
        records = await receive.getCoinRecords(requests, true, rpcUrl());
        const tokenBalance = receive.getTokenBalance(requests, records);
        if (this.tokenBalance[this.token]) {
          this.tokenBalance[this.token] = {
            addresses: this.tokenBalance[this.token].addresses.concat(tokenBalance[this.token].addresses),
            amount: (this.tokenBalance[this.token].amount += tokenBalance[this.token].amount),
          };
        } else {
          this.tokenBalance = tokenBalance;
        }
        console.log(tokenBalance, this.tokenBalance);
      } else {
        records = await receive.getCoinRecords(requests, true, rpcUrl(), false, this.option);
        this.analyse(records, rpcUrl());
      }
    } catch (error) {
      console.log(error);
    }
    if (this.current < this.addressNumber && this.status == "Scanning") {
      setTimeout(() => {
        console.log(this.current, this.nftList, this.catList, this.tokenBalance);
        this.current += 100;
        this.scan();
      }, 5000);
    } else {
      if (this.current == this.addressNumber) this.status = "Finished";
    }
  }

  async analyse(records: GetRecordsResponse, rpcUrl: string): Promise<void> {
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
        } else {
          const catResult = await analyzeCatCoin(scoin.puzzle_reveal);
          if (catResult) {
            if (this.catList.findIndex((c) => c.tailProgramHash == catResult.tailProgramHash) == -1) this.catList.push(catResult);
          }
        }
      }
    }
  }

  Add(id: string): void {
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { account: this.account, defaultName: this.getCatName(id), defaultAssetId: id, defaultTab: 1 },
    });
  }

  transfer(nft: NftDetail): void {
    this.$buefy.modal.open({
      parent: this,
      component: NftTransfer,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { nft: nft, account: this.account },
    });
  }
}
</script>
<style lang="scss"></style>
