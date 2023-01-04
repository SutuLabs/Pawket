<template>
  <div class="modal-card" @dragenter="dragenter" @dragleave="dragleave">
    <top-bar :title="$t('offer.take.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-notification type="is-warning" :closable="false" v-if="observeMode">{{
        $t("offer.take.ui.notification.observation")
      }}</b-notification>
      <template v-if="step == 'Input'">
        <span class="label">
          {{ $t("offer.take.ui.field.offer") }}
          <b-upload v-model="file" class="file-label is-pulled-right is-inline-block" @input="afterUpload">
            <b-tag icon="tray-arrow-up" size="is-small">{{ $t("offer.take.ui.button.upload") }}</b-tag>
          </b-upload>
        </span>
        <b-field
          :type="parseError == 'error' ? 'is-danger' : ''"
          v-show="!isDragging"
          :message="
            offerText ? (parseError == 'error' ? $t('offer.take.ui.hint.error') : '') : $t('offer.take.ui.hint.pasteOffer')
          "
        >
          <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
        </b-field>
        <b-field v-if="file">
          <b-tooltip :label="file.name" multilined style="word-break: break-all" position="is-right">
            <b-tag icon="paperclip" size="is-small" closable aria-close-label="Close tag" @close="deleteFile">
              {{ shorten(file.name) }}
            </b-tag>
          </b-tooltip>
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
        <b-loading :is-full-page="false" v-model="isUpdating"></b-loading>
        <b-field v-if="summary" :label="$t('offer.take.ui.panel.information')">
          <template #message>
            <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
              <li v-if="sumkey == 'requested'">{{ $t("offer.take.information.requested") }}</li>
              <li v-if="sumkey == 'offered'">{{ $t("offer.take.information.offered") }}</li>
              <li>
                <ol class="token-list">
                  <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
                    <div class="column">
                      <b-taglist attached class="mb-0">
                        <template v-if="ent.id && ent.nft_target">
                          <b-tooltip multilined :label="getNftName(ent.id)" position="is-top" style="word-break: break-all">
                            <b-tag
                              type="is-info"
                              class="nft-tag is-clickable"
                              :title="getNftName(ent.id)"
                              @click="copy(getNftName(ent.id))"
                              >{{ getNftName(ent.id) }}</b-tag
                            >
                          </b-tooltip>
                          <b-tooltip :label="$t('offer.take.ui.tooltip.spaceScan')">
                            <a class="has-text-dark" :href="spaceScanUrl + getNftName(ent.id)" target="_blank">
                              <b-tag><b-icon icon="open-in-new"></b-icon></b-tag
                            ></a>
                          </b-tooltip>
                        </template>
                        <template v-else-if="ent.id">
                          <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                            cats[ent.id]
                          }}</b-tag>
                          <a v-else-if="ent.id" @click="ManageCats(ent.id)">
                            <b-tag type="is-info" :title="ent.id">
                              {{ $t("offer.symbol.Cat") }} {{ ent.id.slice(0, 7) + "..." }}</b-tag
                            >
                          </a>
                        </template>

                        <template v-else>
                          <b-tag type="is-info" :title="$t('offer.symbol.hint.XCH')">{{ xchSymbol }}</b-tag>
                        </template>

                        <b-tag v-if="!ent.nft_target" class="" :title="ent.amount + ' mojos'">{{
                          demojo(ent.amount, tokenInfo[cats[ent.id]])
                        }}</b-tag>

                        <b-tag v-if="sumkey == 'requested'" type="is-info is-light" :title="getAddress(ent.target)">
                          <key-box :value="getAddress(ent.target)" :showValue="true"></key-box>
                        </b-tag>
                      </b-taglist>
                      <a v-if="ent.id && !ent.nft_target && !cats[ent.id]" @click="ManageCats(ent.id)">
                        <span v-if="ent.id && !cats[ent.id]" class="pl-1 pt-0 is-size-8 has-text-danger is-inline-block">
                          {{ $t("offer.take.information.addCat") }}
                        </span>
                      </a>
                    </div>
                    <div v-if="ent.nft_uri" class="column">
                      <a :href="ent.nft_uri" target="_blank">
                        <b-tooltip :label="ent.nft_uri" multilined class="break-string" position="is-top">
                          <img :src="ent.nft_uri" class="nft-image" />
                        </b-tooltip>
                      </a>
                    </div>
                  </li>
                </ol>
              </li>
            </ul>
            <template v-if="isOfferNftOffer">
              <label class="label">{{ $t("offer.take.ui.label.totalRequested") }}</label>
              <p class="is-size-7 has-text-grey label">
                <span>{{ $t("offer.take.ui.label.nftPrice") }}</span
                ><span class="is-pulled-right is-size-6 has-text-weight-bold has-text-dark">{{ demojo(nftPrice) }}</span>
              </p>
              <p class="is-size-7 has-text-grey label">
                <span>{{ $t("offer.take.ui.label.royalty") }}({{ tradePricePercentage }}%)</span
                ><span class="is-pulled-right is-size-6 has-text-dark">
                  <key-box :value="getAddress(royaltyAddress)" :display="$t('offer.take.ui.label.royaltyToCreator')"></key-box
                  >{{ demojo(royaltyAmount) }}</span
                >
              </p>
              <p class="label has-text-grey label">
                <span>{{ $t("offer.take.ui.label.total") }}</span
                ><span class="is-pulled-right is-size-6 has-text-primary">{{ demojo(BigInt(total)) }}</span>
              </p>
            </template>
          </template>
        </b-field>
        <template v-if="isNftOffer && !isOfferNftOffer">
          <b-notification type="is-warning is-light" aria-close-label="Close notification">{{
            $t("offer.take.information.unsupportOfferNftOffer")
          }}</b-notification>
        </template>
        <fee-selector v-if="summary" v-model="fee"></fee-selector>
      </template>
      <template v-if="step == 'Confirmation'">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($tc('offer.take.information.acceptOffer'))"></span>
        </b-notification>
        <div v-if="summary">
          <div class="label">
            <span class="is-size-6">{{ $t("offer.take.ui.label.offer") }}</span>
            <span class="is-size-6 is-pulled-right">
              <ul v-for="(ent, idx) in summary.requested" :key="idx">
                <li v-if="ent.id && ent.nft_target">
                  <p class="has-text-right">{{ shorten(getNftName(ent.id)) }}</p>
                  <img :src="ent.nft_uri" class="summary-nft is-pulled-right" />
                </li>
                <li v-else-if="ent.id">
                  <span v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                    demojo(ent.amount, tokenInfo[cats[ent.id]])
                  }}</span>
                  <span v-else-if="ent.id">{{ demojo(ent.amount, null, 12, ent.id.slice(0, 4)) }}</span>
                </li>
                <li v-else>
                  {{ demojo(ent.amount, tokenInfo[cats[ent.id]]) }}
                </li>
              </ul>
            </span>
          </div>
          <div class="label">
            <span class="is-size-6">{{ $t("offer.take.ui.label.receive") }}</span>
            <span class="is-size-6 is-pulled-right">
              <ul v-for="(ent, idx) in summary.offered" :key="idx">
                <li v-if="ent.id && ent.nft_target">
                  <p class="has-text-right">{{ shorten(getNftName(ent.id)) }}</p>
                  <img :src="ent.nft_uri" class="summary-nft is-pulled-right" />
                </li>
                <li v-else-if="ent.id">
                  <span v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                    demojo(ent.amount, tokenInfo[cats[ent.id]])
                  }}</span>
                  <span v-else-if="ent.id">{{ demojo(ent.amount, null, 12, ent.id.slice(0, 4)) }} </span>
                </li>
                <li v-else>
                  {{ demojo(ent.amount, tokenInfo[cats[ent.id]]) }}
                </li>
              </ul>
            </span>
          </div>
          <div class="label">
            <span class="is-size-6 has-text-grey">{{ $t("offer.take.ui.label.fee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(fee) }}
            </span>
          </div>
          <div class="label">
            <span class="is-size-5">{{ $t("offer.take.ui.label.totalPayment") }}</span>
            <span class="is-size-5 is-pulled-right has-text-primary">
              {{ totalPayment }}
            </span>
          </div>
        </div>
        <div class="mt-4">
          <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
        </div>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button v-if="!bundle" :label="$t('offer.take.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button v-if="bundle" :label="$t('common.button.back')" class="is-pulled-left" @click="cancel()"></b-button>
        <template v-if="showTest && debugMode">
          <b-button
            class="is-pulled-left"
            v-for="(c, idx) in testCases"
            :key="idx"
            type="is-primary is-light"
            size="is-small"
            :title="c.tip"
            @click="
              offerText = c.offer;
              updateOffer();
            "
          >
            <span>{{ c.name }}</span>
          </b-button>
        </template>
        <b-button
          v-if="!bundle"
          type="is-primary"
          @click="sign()"
          :loading="signing"
          class="is-pulled-left"
          :disabed="observeMode"
        >
          {{ account.type == "PublicKey" ? $t("common.button.generate") : $t("common.button.sign") }}
          <b-loading :is-full-page="false" :active="!tokenPuzzles || !availcoins"></b-loading>
        </b-button>
        <button v-if="debugMode" class="test-btn is-pulled-left" @click="showTest = !showTest"></button>
      </div>
      <div>
        <b-button
          :label="$t('offer.take.ui.button.submit')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" :active="submitting || signing"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { combineSpendBundle, signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { getCatIdDict, getCatNameDict, getTokenInfo } from "@/services/view/cat";
import { AccountEntity, CustomCat, OneTokenInfo, TokenInfo } from "@/models/account";
import { demojo } from "@/filters/unitConversion";
import { SymbolCoins } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import { getOfferSummary, OfferSummary } from "@/services/offer/summary";
import { decodeOffer } from "@/services/offer/encoding";
import { NotificationProgrammatic as Notification } from "buefy";
import {
  combineOfferSpendBundle,
  generateNftOffer,
  generateOffer,
  generateOfferPlan,
  getReversePlan,
} from "@/services/offer/bundler";
import { Hex, Hex0x, prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import store from "@/store";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import ManageCats from "@/components/Cat/ManageCats.vue";
import OfflineSendShowBundle from "@/components/Offline/OfflineSendShowBundle.vue";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import bigDecimal from "js-big-decimal";
import { shorten } from "@/filters/addressConversion";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";
import { constructPureFeeSpendBundle } from "@/services/coin/nft";
import BundleSummary from "../Bundle/BundleSummary.vue";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TopBar,
    BundleSummary,
  },
})
export default class TakeOffer extends Vue {
  @Prop() public account!: AccountEntity;
  // @Prop({
  //   default:
  //     "offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmzphgzr85cmhln3ntar8v8razh2j3ejucf6za70898u9xhcd72hs02gr2t3q80hdpvmjtcl7g3nhjfnd65x239r7hmth4x6z0nw5u0fldxrnv7c9g0lnvvyuy9ppnjqsfgnlltt2m40len3smh0mvjtzwax53xwd60dfdeugk2h85ggs5jskuepg4tec53pjglyewll3hy7nfpgn80n265sv6lc2clknc3e420l8upyxs9pncwdargcjq8uakddrzvq6xycplur0s3qpy4kzl227vs2mell0c5r0wnnnkfkm4yh9hmau37yyluyfxkt340dust4k6hxla04qu4x96fvty990ntmx3cpzdu40lnm7zxxtfmd78pgd5chsghw4pu4e4d0pljr4xfxwsxzsx6xl72xdv8zmtankg46uwk4h4hvn3t90e9uu845t5ym2z4e7qvf6l4qf5pp38t7rzldxrlqqjlkpq00lncr9lusy4mquphm0manvv89kke54tj6jekt9m58s9ljeulygwc8c506laq9q3jff9qmr9d70eaxj7n6dfgmuhn6vey5v6vjtentulnj29j5zjt70fgkys2x54hyjln7femxdzt7vehxy7n2k9l95lj3kehxa2nw060zu3yrdegkv5jj0609us278tgp2xgtne5e70ffex72rw46ah3h4sdr0ah3ahh2htlllpxqezef7taw64x8en0llal4xtkslgpf3ad9d92etft956nftxwfh8r2jedxvmyu2fv9fxucnzv4ghv622deh9v6t2v4g55uv7welyucj6g4fx5h4z29uk5cjedf0fu6jf06lygm4wh7mes7d3kwf6lydwkpv45uuw073mscun5em6zjayg40m8frxgpf9slacvwyhjajsx8xhjsqt2ws9vee9yc26vefx5et62eckz4j9dx48j6jzdkk5jkjfwe4xzj23t9jhrxd6ffx4z4jk2x89z6qe6xcc42txm2j7t9geax2h5p390xvs26k909ukjfw9yhuyfstr68yvhnkt6hxv5n20ec55l4pffdysykzhnhrqxgzftfprenz6ut33lv9jwxeel2lfl2mv8eua4a636dj4hmvwl20ce0a0yn7kk5edpaepu3jzu56fwmxtual0cl45p89knjn4tvmkrnwkng0pzaf06a7nmpl7lz7raqqkzyll4l9ajntl6x3940lhchxuur4fhf7w4nd0da43gndn89ht6uneu7j73hjef82arxpgjl8rxwfjxuunq3wr8ll5ve993w8zf7xdfepvh0ar49090t2uc53pagma0hpc4u6w5heza09hfp20ehru9z4dkmw3846rdzp3tgag04ffrkw7zxvauqdlgvealn4aa7z6zz2mvev4dthe2r3j8gsjxswm7e6un4sld9um4fehgjsy3cvm6lftqag3v38vczepus6w9j66cd6ucpxeuv8qjhwwllnh5gh3m0mxw8h7faafh0tzza97fjp6ktqz0z7juz8ekmtp4hnpyfg9m787wzn32u9fjv8tx3dvzjkyqet7hl0aq7pu3eelvzd6zey7chh8mhwmy4afljtzjmve9l73xfhqhd8kavy56wle0kqf5hm6cysak00hysx8c0cew3z4mke9kf3fmlhaexrafk67948pykdcptkrp57sz8vv9s0yrv468q7y0w8lctpqxm4qn5zp2qfnmqd5ajaeadpulatkuudcmr24h0yr87ldt4ek8egu5n6jmel84gjpf8tm8x6nn087jtnvm8knreksah35fptxq36htzzvk38l3ualke59wyl92lpc885nnukg7t9uay2m43ekwlw60n0ayklj7c8e4l6je8ka0xf5tvtvpqpp6pcsss00l0pg",
  // })
  // public inputOfferText!: string;
  @Prop() public inputOfferText!: string;
  @Prop() tokenList!: CustomCat[];
  public offerText = "";
  public file: File | null = null;
  public dragfile: File[] = [];
  public isDragging = false;
  public transitioning = false;
  public makerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public submitting = false;
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public step: "Input" | "Confirmation" = "Input";
  public fee = 0;
  public parseError = "";
  public isUpdating = false;
  public showTest = false;
  public testCases = [
    {
      name: "1",
      tip: "Pay CAT2 for XCH",
      offer:
        "offer1qqz83wcsltt6wcmqvpsxwgqq6tmp20fkzcmnnwmf7mff2a7a0shrpjyfl0ytl6e7hwt0887qncnmeemqatsymvx33fkmgcsm4hvyv2ak6x9xmdrzlvl5q9gm53c97c97aaeu9w7kgm3k6uer5vnwg85fv4wp7cp7wakkphxwczhd6ddjtf24qewtxs8puwhkv7ak7uzfvtup8zu8rjhmv8kcd5rue94ny5znv0mf6c2gv4s46zax6a9wrzxyzvstefhrrmjm95cvxex98tva7kkamv8vn035nl99wtj7dyglt2hqmxlujxuqfgawlntpdnwtnke79vn2rs6sdhvhaes8m7l86hv6hjclfz5kw0mtzrl7lad430e7vssyygwgeghk76l4swmvjtrc5hc0cjlkr77ugfnr3hxkks4u0gx37k44m600lvhuasekhht8dtavh972nm2muhqmcqe0mrngn03wy029d8ag2346xkxw9srkf2g7swj7c3udzuzldvrrv7xr0fz6agm4jd0vctha5sa48v88lfunl8guumtq6lurhl8tmynd6hffletf0rm0axl5yaumlelenu5a4m9np6kt2qvj4tljlk84eqc7nlw7krlvu024ymkr89sf7elfpx9h70ccln82ww965lkwa7hleh7x7pdx8schscrtq65e8kw2we6wuuxdumh6538z7600s6mzxn08n5h0h4aamzltl90me8xm4lad33xxukf9grzndlchdj5dhuwjuag60sv0a69a7vmh094fa2es0fwjgulpqxfmg5kgk6u395up4tk07t6ch8nqpv7jnkw3z8a5hjdj7z22hlymm5pxylcr2v8eatavg5yrhuv3lszp8glhk3kdjxjrmgg0pjv06xgwddc766yhnchhunmpmuum8xq4sxh5at3ak460vw4fzjkl30hmjale5dulnpjhyeza486d4lhap6v4j2mkd64q0dvrr9hegvj0rds5ng79ha9ztcvcg9csyjedm0aaf484sa2jl8e58v7z0e4wlk9zqk03nl79e5kejxln7dj5r4cas7t2v7qauhdy53slklup7x3g5ectajh0y477p3vmeedpuat5n5cnuemq783d87e66urt7u7hx4as37ptg0jamuhff9dj5ea7w57ru36hwcsek4k0emn2l4e9cvmmje073rnngnzqcyu0dth53ja5wjyfn8aec2ppj96e5lvy6tr483mvluwnnjjmwtvvdnx6m46vvjyrw732j489fn8uuyt33rgedtrucxkkctndmymx0llm3d84w006jh7m8m5nqkc76p0dq8tsd6waf5ua6xpzhf7w93umd0mnaalx052ej4460hggt77f4cf520cl8dr8z2w97tpvz6pj5w33kujscgevvmtw7yaczuez8g0d2lwegw4he3yrny0e2527hny9pcr8jw80zx4g5h2hmskkdl3hlpcu2agn392umhskslyc3xw9mvaaunr8mc4mqs22h036636fz8nk9adzts4lhwclpwlws77xdc9zgfk07rn0p8qmvyc58peux0elpqnhymyjm83va7j4t8n9kje0hd6dldawgkpdy03580hss4vj2z2lpaxresdutehl8h2mwl0l93salu48agupll9trpnmgxms5m05me707lvvl0mdnxckn60pjy6m2axnhu7wttah84x2q0m7v8ggau7z8v2v26g3zqxl2lu2klgzdy8",
    },
    {
      name: "2",
      tip: "Pay XCH for CAT2",
      offer:
        "offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmxpemd4um5kwgetnwdxralswd9677kfhuheclhjptsfnlm4v4vtajxlqqf2095z9an6eh2glz67dml4ljgcetlv8vk5u9eudg7u3m0llppjumltt78mh7xlzxptmudqdvpad0hjdht6dam0qseg87369a6x8mg6vq5f8zmj0n6j9s4auvn3s6zmm9agx0unrqm0kf7f9x86x7rjtpdvf42mcm5kmglpvymhje4k70m05szg5gvwput3zr0968nvw68nvw60jvw6lsvx6l5vxcllur6s7vp49wp0xr0lww0pt4468udkhxg4zymj3lzr9ts0xz0mkd3sdenkp4lwrfv6624gkfj35pc0rham8hfhhqjrrlyfc4pcu46mplktvqmxe0veyq5mnu6xkzjr4v9wgznw8zhjyqcmh3san4nv0hzmarj2v4rh87m9uym3v3e2w7wfpaygzmswhtfu5flura2hk9d38sl4ax8r8vlutxjqk4rxk8q5vgzpqc6ypkn9lut3q6hzl4hszdcapq4sfxt27dlur6sfd2clm2l5edm8q0tkdw7amvd26vh6466dkznt6xm8fh39fy0899q9tahlzajxaln028wfwdnn6af5teu9rd0uk6lcr4g5exnm0h3ptfdelavfntsaskjw0lctlztj72rxu8llz0nuampnuldeaxu6we8r9sty6a4u077l5hwkvtc52vup7mjewen0u44g6ccvhpelvehyaftn8wscjj8l8azcmm5hj4h4cfe49n0l26ng37y8vudlutmsz75feyk85ecwkm9ycghammum0l70ualaaqttz0fn2cnnkmdl4md8qxmgrksed4hlqkzd5k5sup4zpj3v58wkwtrz9eyswldaj2unpc7kskwf63m7h088wzxntk4jjhh54yklcfwv93g9smzcxea4znjvfrv6ukvla0l2s8rmvulhhyde0ktu3gurhnatuh66uawcckdlmlwtx62fvcw9hujlsaw4r52ztv27vdpym90qlljnjzft6mrl9l062rtn7juaedztnulkh0lxlwjzu5mjf2natgtd0m5526j7tftt6tcq24gwkfglw7q59",
    },
    {
      name: "3",
      tip: "Pay XCH for NFT",
      offer:
        "offer1qqph3wlykhv8jcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafsyjlm5pqpj3dkq7tjalg8mavn5l0rpvkf63762j02kf05em8j27ftplu8pt686dxmsxwcwpwt87wdam4x6w2kctdrxjah4524ektl9h3g2al0glxm0mam23xxfwk6dl7mnrmrjmmhvqsyy22gyx3x4ptwxl0rdpx9kyml9fh7pu2c7zxn8xsms076nhq7c4a43ytzz4lmxuhf9v6jrx6wfkh26w2552mh5a8g659hz3akccrjh36842ju3vxmmdq6r9s5tkrg5zx8yyf4hgyrxwsgxd6qdcfqd9a5zlf25ds0maa08cu80xsnahf3mf8hthruufl5g7vyfzkmm480uvf9uml8lp0kxtkl0fst5umw3t760sa4452vhpd8x4txl2v65j6znxayyje2d6kd7ur7cw539e7qggqmfmlegm4sutf0xwe2ht366577aj29uhlykns7k3wcjdg2h9cf38t6y8xcyxqa0gvmusalvqzt7cypdl70pvhlzzjlvrsx0dl0kd4sv56m8j4wt2txevnws7qlltrnvnpmqlx30flupezxf9y5zvg4hmldycj6v4fx5ejjf9ty24t9t955j7jjweuhuun68evm55wwv998vu23ve0y2333r8yeyyw3sevajmj6wfrxuwje6ylxnuj6y40wvs26x90dukjfw9yhu5tz0g49annxtcmxs23ludqn956ksrz5jmg8ddlcw0xvj34pwjtm7nejetl6xdc76wa0k04ld3sz9dh7q3cd652aj3dfrxve2p2954vk22fxgen2v3jxlxu626t94xnf26g92hjnn9dxucjlnfffvhzjjw0fvh2u2w2fgh5nj70xv626jwxaq95sads4vuql4yk9yksrydmrg9meddxel5emlxl06a9ak6xew3vzentjjlvu5x50fhgcdyvtgtx0lmuyshjmlth08a65trmxl9dfl0ehxu5x4a4fkwandtwah3qkd084etjen9aw7l3jjwzxsa09p5n8arqdh6xqnwqhwlyln4uzxds7dzelqp4f0v82alk489lf2qm53pa0mpd8fcae6j4hlrd29ht3w0ejrg8zhdxlw4x45r9weq6kd4fg5lajyanzulkrtk9ckk708rudal2hk525h2tu6nw28fezv5cpfyfrs0wzxq7ugdsqqzu62a6xhq9dtpt4flwa7le3h49f8h9qmzlh305jmw4wn6wrgsezdjnj4dhekkc3v8ygx2nvv8gsw0sga3ztttphdjffmpsgm0f0hf9f0nm46mdr77t6e67w8t8apjfj4ktu5lhx4ukfnqvu2607tf8m3h65kylhpj7wgpsauwkhjwmm0s22e5rdg63lu9v0k07quj9kmslpye5f784ekl646hal8t2u028vum6da5486eewt7cmhw9h6s9wsvxhaqya33kruqvc7qsm0pvyg6ljz7gptqg692qjusarz3nakllmlcywhddfzw047mw6jru2d67k8kz5vgjrhmcyltsxjuzd6lehxnkwm2le89n9ld3l29n6nn90llp4yfvxgmmkv0vc0mtw9408x5r6yrn4ttamkajyukmakrcufhl8am8xh2kex6r2tmajlunjqwpagmltjpkyllr966kqndjmlclup3pm6dg06ale97wc0ncum8dd78efm70an8a6axlgsal64mksh6zqqvatvykquh804h",
    },
    {
      name: "4",
      tip: "Pay XCH for NFT(Royalty too low)",
      offer:
        "offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmxp9lt3w2uzrjmwlnq2hr74qvmq4h22x9mw2lwp499e0a4wkp70t7jlyy4g5sjgpl0vjklyeyu0h4a3u8ymepef3t6dlf3ghkdh06s38cg8d3mfhh06mlz0eqsgv5sy0ay48kkf7l9d6rhgh6m899mxml0x4w9edmhk382e79flh4q0znhdq38lv220533k5pglncljpa92vdna0gmh8y4ut55dta793ulpc7qsxw5e9ngzseyyx735wfcz7zmkk338qfrzwqh7plegjqzgmf09p0729pu0lhvtplhfmenymd6z0jta77glxz0azyntrcjkk7f47m9fn8lhlswfr2np77eyd00kc4hgnsk7ma6x68kftq8an0n0ykgmljlemmknl5nthc8asafztnuqsspknhlj3htpckj7vaj4whr44faamy5te07fd8padza3y6s4wtsnzwhagzdsgvp6l5c8efclcqyhasgzmlu7ze07y997c8qv7m7lvmtqef4k092uk5kdjexapupl7k8xexrkp7dz7nlcr9gey5jst32kltaynztfj4y6nxtft8rdn3k9z4j622wed9r2d7df3yue2pffzkyjjxffl8j5vesecev6jfff4yu62fjetxjlje3ftx5nj20xn9afjptfc4a8j6f9c5jlj3vfax5h5wve08vl5s97h6gcryv3hxc6r04p4xukjkj22fdf4yv9j9smykd2gx9ytxje229yng4fsk55r2je4f5c5j2jn2jhr25pgx4grvte32u5rx59wx4gnx2e3fz64pvesxsezhjptma07qcdxzm6veukvj2zd6f9uln74el9u7j40fnx53tfteshv7jw5fc4vljwj9e9jm47wfnxuega6zwq7rx4sgz6lfmllfexny7dalhv9d94h70jv27hlk338sctlnkllsjwm35tq3swumk2q5rwc645spxngvf3fucjujxt4dxz7t3we6kvctxv9ghyntxv4ucv5df2f89nfjwg4gkzkjxffum5lnev9u4n22fg9g4u43g7kzu6jfvfwphejfserwj95fpxrgjpjkj6tgvzvfexnxvjvxeyrwj2dxz65sd2tfscr2jf5kayrqdpnf66nzvfjfyey6vekxumn2v95fyeryn2vxqcnr4k2908ul7nl5zydtg99hc3crqg2rq7xu270q2xr695ksrydmrgy6yrz74msft8ezkyu0tsupkufgahqt8hhp0vtfftvm30p6yasfn4sywed6hlw4ulh2f00g6vh4l7lzumjs24ka8emkd4dhk7yzfku7k4wtk0h36t6x6tz5en5nv822fgcnkn348dxytsellaz6f6vt3cj0knwjgt9mlgaftet66hx9yg02xltacw90xn497ghted6g2n7dclpg4tdkm5fawsmgsv2682zaw3g7nmk348hvr06axh0ua8w3gh0suvxc3qarjmeetpkejll4qrxctgh9m9hnl4cyghelqml724en9dxdssvkxzp3e4ury93smklvya3cqdx0zp2vhmauk8thyjlhsg932pahucyjazmd02majc7s5jqw04gtg2260xzwh4l8thy66w936e5k8nmad2masx2csr9t6llluzw4xj7a3dwy4dc6n872u69may4r6fxsawh4fhsnkchmtmqh9339wk9n0lq5ra58mht00eakem94vxnvagmzy6693d6g7s2kueyk3ze83xez27a8g2wcvks9qwa3sxpccvjnxuzs6lcml3wyq60urwjg9gppg4cm2c0znkq5k0h4cgvetpj2r6uun2fgwv5w8mvxum37t97m5nkq7t2utzm0a64zutkc4amz4k2d0lhlvz0ukuj8msccwm6evlcsz94mhem4539azjhdtxa6u8r7u2kx80m7dmrmr8nfwmgwthguqxr4hy7dg3n0x0xzgqcax3g9g2uyup7",
    },
    {
      name: "5",
      tip: "Provide NFT for XCH",
      offer:
        "offer1qqph3wlykhv8jcmqvpsxwgqq2g0eunkl9xu2343t4twx3tlfl9u6w7zuryxelx67p2uhkdjda6ffjv2vr57wnrmkmernhmugctsl768805y8dh3pd9a5rlf250s06ae086u80x5ndhfe6f8hm4ruufl5g7vvfzjmm488avd9vml07pffwgml4ruyljteau0vhw5dng3hnuuf20e7866wtfdf7x4sk6c29u9lzttcl7s4fjfnyrs5pk4h0j3ntpuk6avaj92hnh49adlyuget7ft8pld2u3z5e4cxyaxgvp6vscr5ezqtgggrwzp9lvxqwal83xtleqfrkpur0klh6xuc7td9jf2h949nvk0hc0qrl9ne7gs4303gl4ljqgdr5jj2pkz2tuljjvddxg5n2ve4kx7v9j9verzrswe8976nqdf0husz00euy5mnt0du9q7al0pg8vjmng4q5zeryva3kzsz92auk2ct9fpq2yhmxg9dtqhjltdyhqjt72p3842j7fen9adalhxggjhjqtcaazngcp08xmwulmlnn2lkhcs5jh6mtmmmfjw9vpq82luhlk8uka8845vk3w5umsxxvyhdqvvfdz8vjjzwed95utesedynwt2f93yntjadxr9ryvfje74vsneveghnrtkgxn9n9j4tffy572e2e88j52etxl92k2x9akv2echu8jsxhq9a3tlswg53dn9zuqn68w66pspgkykzwwdlxzj6y09d4jsryvfr50g2ff9z5sez7wde9r9ugf9dkrvrgwdf925uqtxd9nrjfwauyg2mknfqrw908x5c46qw3y3xuctjp0m99nux0ycm7yclr3t2u8mmjkacxsnwl9g0wzwadd7uge489vht7yv3kpq2grhv5kxs2t7c26udtlplhf9t8uvvlule05lweg430j8ga6j9wmzl4m48rlphds3zlp0e0dull23y0vmuak8elxcm236lh4yethdavt57vpeau7h97txyh4amkx22dgarfq5fjen5z35hg9yfspalaruwygg3knl5r9zc99ragatml2juh79yzwjylhlgyyl8n48w2kmudkg6a79el9g9pvwa5ea756ssvkc8yr9dxuar5x3n8gdr8kz8vws8z3dltmts9x7q7awrx4f79ju04pee5uu54mxvjstu07rv87ah79ev2mg9ywcvax4cqvhvz7g0xxkskttwsk54qeytpgzsllljlxpmydn70pwhrkrlgadxuunt6dq2nhj8djpwvhv5tydwrsdlhrfp6aq558n7xn2nmat2h9dleuhh0ct0m4c95g72vj2524r76dl242v80mmpmfm4qwqj2szt95myl2m6tzfhnaj8zd2lzyufk6f0zrsjx27803efh90mv686t658keka9xlwutcgr2fug0mt3c4ejdnzcs307wat3f7lxwxhed94k362w58g2srqvp4xujjrlmhguhjmqh05pgm83sa5tv9dhku5gfels4xmjk9m5sj7tr7t5hdvlh80wm9l5wn8ygzlsk2ayekwj69a8dpwer79t8lug3uvux4s6cry3uh7hasdwg785nmhhsl680m4fxdseavzdk8mg93dank88ue2hned4tarn0al7fljh6e9m9wscr2y9ghvjzh2sq4tvn3uhhkht6c5kh7lkhyrn49tmfjap7yd4urda8ccygmzaala5awy0mudljhgr75ng9dgmrn07q4plcljz0ja00lluhqjltah2azy29nral7xmxeaa7dumw7w3wl682k5agp2l0lsh84l8g4ttgkv7pj88xwplsu4te5ulsm8tv7atq3yhfcld0kv3tsnn5r9z4t5lr20afc3qumzjnlq0jlk09h0y85aff6dzvj7v04mknq6mc0vqa25sqwv2dskg484293xmrcaa0lp8zwmghtnwpmu369hcxh54889ff4ydhlskcsjt0ytl38k68zyvmrzk07mls888pfh8y20n3tl5llanmrdmju0nedxmae7v7ndlty46mfua9l30kyq077glepame5gz749r2v8h96vluw9aarpnsvhj2crhehjaee6vcrp62hkhn387ffz2nxhxmct430ku3nt5tvwjsu8mc8ap6sz526nf5tccs0uvy0rxjedka4sh84cvhp4r7p8ew39px8hf0q55f5rmj4uth65hl8jaha70k40fjhk0wjn9zl9ef8xmrma2yj8tpvvnrclh9tyn666acduj378famf7vuutuma0spyxfcl29vxc5r3tkj0wng5x9ujv5a5amuq3zueq88nx86ngmeucs89nxegjw37z5l8m4hjk06lv8pe2c48guzfewq52572wm67u7pt7p47lngjgf2j5vrxcq2lq6ztz55lyzrkr2qy5z8kqusq6xez2jpdev0972fvmf43p07v6f0aaglwm8mg9t5wzl7lfhjlgevr37kgtufm6m5pglv6et4z3tha9eq545mjuh3u860z0gkdkxx9kj3wmh4xrxd8j9ckmn9whk7c8msega2vwerdcj2xecea6s3vf8dhtt6umv5hzua827y9cfcqfnqkcac5mvl9y",
    },
  ];

  @Emit("close")
  close(): void {
    if (this.path.endsWith("take-offer")) this.$router.back();
    return;
  }

  cancel(): void {
    if (this.bundle) {
      this.step = "Input";
      this.bundle = null;
    } else {
      this.close();
    }
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  get cats(): { [id: string]: string } {
    return getCatNameDict(this.account);
  }

  get catIds(): { [name: string]: string } {
    return getCatIdDict(this.account);
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  get totalPayment(): string {
    let xchAmount = BigInt(this.fee);
    let nftAmount = 0;
    let catAmount: string[] = [];
    if (!this.summary) return demojo(this.fee);
    for (let req of this.summary.requested) {
      if (req.id && req.nft_target) {
        nftAmount++;
      } else if (req.id) {
        if (this.cats[req.id]) catAmount.push(demojo(req.amount, this.tokenInfo[this.cats[req.id]]));
        else catAmount.push(demojo(req.amount, null, 12, req.id.slice(0, 4)));
      } else {
        xchAmount += req.amount;
      }
    }
    let res: string[] = [];
    if (xchAmount > 0) res.push(demojo(xchAmount));
    if (catAmount.length > 0) res.push(catAmount.join("+"));
    if (nftAmount > 0) res.push(`${nftAmount} NFT(s)`);
    return res.join("+");
  }

  get nftPrice(): bigint {
    const s = this.summary;
    if (!s) return -1n;
    return s.requested[0].amount;
  }

  get tradePricePercentage(): number {
    const s = this.summary;
    if (!s) return 0;
    return (s.offered[0].nft_detail?.analysis.tradePricePercentage ?? 0) / 100;
  }

  get observeMode(): boolean {
    return this.account.type == "Address";
  }

  get royaltyAddress(): Hex0x {
    const s = this.summary;
    if (!s) return "()";
    return s.offered[0].nft_detail?.analysis.royaltyAddress ?? "()";
  }

  get total(): string {
    return bigDecimal.add(this.nftPrice, this.royaltyAmount);
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  get spaceScanUrl(): string {
    return store.state.network.network.spaceScanUrl;
  }

  shorten(name: string): string {
    return shorten(name);
  }

  async mounted(): Promise<void> {
    if (this.inputOfferText) {
      this.offerText = this.inputOfferText;
      this.updateOffer();
    }
    await this.loadCoins();
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1, symbol: string | null = null): string {
    return demojo(mojo, token, digits, symbol);
  }

  BigInt(n: string | number | bigint | boolean): bigint {
    return BigInt(n);
  }

  async refresh(): Promise<void> {
    this.tokenPuzzles = [];
    this.availcoins = null;
    await this.loadCoins();
  }

  async updateOffer(): Promise<void> {
    this.isUpdating = true;
    setTimeout(() => {
      this.longRunUpdateOffer();
    }, 50);
  }

  async afterUpload(f: File): Promise<void> {
    this.isDragging = false;
    this.offerText = await f.text();
    this.updateOffer();
  }

  deleteFile(): void {
    this.file = null;
    this.offerText = "";
    this.makerBundle = null;
    this.summary = null;
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
    this.file = f[0];
    this.afterUpload(f[0]);
    this.dragfile = [];
  }

  async longRunUpdateOffer(): Promise<void> {
    try {
      this.parseError = "";
      this.makerBundle = null;
      this.makerBundle = await decodeOffer(this.offerText);
      this.summary = null;
      this.summary = await getOfferSummary(this.makerBundle);
    } catch (err) {
      this.parseError = "error";
      this.makerBundle = null;
      this.summary = null;
    } finally {
      this.isUpdating = false;
    }
    this.fee = 0;
  }

  get isNftOffer(): boolean {
    return !!this.summary && (this.summary.requested.some((_) => _.nft_target) || this.summary.offered.some((_) => _.nft_target));
  }

  get isOfferNftOffer(): boolean {
    return !!this.summary && this.summary.offered.some((_) => _.nft_target);
  }

  async loadCoins(): Promise<void> {
    if (!this.tokenPuzzles || this.tokenPuzzles.length == 0) {
      this.tokenPuzzles = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoins(this.account);
      this.availcoins = coins[0];
    }
  }

  get royaltyAmount(): bigint {
    const s = this.summary;
    if (!s) return -1n;
    const royalty_amount =
      (s.requested[0].amount * BigInt(s.offered[0].nft_detail?.analysis.tradePricePercentage ?? 0)) / BigInt(10000);
    return royalty_amount;
  }

  async sign(): Promise<void> {
    if (!this.availcoins || !this.tokenPuzzles || !this.account.firstAddress || !this.summary || !this.makerBundle) {
      return;
    }

    if (this.isNftOffer && !this.isOfferNftOffer) {
      Notification.open({
        message: this.$tc("offer.take.messages.unsupportOfferNftOffer"),
        type: "is-warning",
        autoClose: true,
      });

      return;
    }

    try {
      this.signing = true;
      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));

      if (!this.isNftOffer) {
        const revSummary = getReversePlan(this.summary, change_hex, this.cats);
        const fee = BigInt(this.fee);
        const offplan = await generateOfferPlan(revSummary.offered, change_hex, this.availcoins, 0n, xchSymbol());
        const observers = await getAssetsRequestObserver(this.account);
        const feeBundle =
          fee > 0n
            ? await constructPureFeeSpendBundle(change_hex, fee, this.availcoins, observers, networkContext(), false)
            : undefined;

        const utakerOfferBundle = await generateOffer(offplan, revSummary.requested, observers, networkContext());
        const utakerBundle = combineSpendBundle(utakerOfferBundle, feeBundle);
        const takerBundle = await signSpendBundle(utakerBundle, this.tokenPuzzles, networkContext());
        const combined = await combineOfferSpendBundle([this.makerBundle, takerBundle]);
        // for creating unit test
        // console.log("const change_hex=", change_hex, ";");
        // console.log("const bundle=", JSON.stringify(combined, null, 2), ";");
        this.bundle = combined;

        if (this.account.type == "PublicKey") {
          await this.offlineSignBundle();
        }
      } else {
        const revSummary = getReversePlan(this.summary, change_hex, this.cats);
        const fee = BigInt(this.fee);
        const nft = revSummary.requested[0].nft_detail;
        if (!nft) throw new Error("Cannot find NFT");

        // royalty_amount = uint64(offered_amount * royalty_percentage / 10000)
        const royalty_amount = (revSummary.offered[0].amount * BigInt(nft.analysis.tradePricePercentage)) / BigInt(10000);
        const offplan = await generateOfferPlan(
          revSummary.offered,
          change_hex,
          this.availcoins,
          fee,
          xchSymbol(),
          royalty_amount
        );
        const observers = await getAssetsRequestObserver(this.account);
        const utakerBundle = await generateNftOffer(
          offplan,
          nft.analysis,
          undefined,
          revSummary.requested,
          observers,
          networkContext()
        );
        const takerBundle = await signSpendBundle(utakerBundle, this.tokenPuzzles, networkContext());
        const combined = await combineOfferSpendBundle([this.makerBundle, takerBundle]);
        // for creating unit test
        // console.log("const change_hex=", change_hex, ";");
        // console.log("const bundle=", JSON.stringify(combined, null, 2), ";");
        this.bundle = combined;
        if (this.account.type == "PublicKey") {
          await this.offlineSignBundle();
        }
      }
      this.step = "Confirmation";
    } catch (error) {
      Notification.open({
        message: this.$tc("offer.take.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signing = false;
    }

    this.signing = false;
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(
      this.bundle,
      this.account,
      (_) => (this.submitting = _),
      () => {
        this.close();
        this.$emit("success");
      }
    );
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  getNftName(hex: string): string {
    return puzzle.getAddressFromPuzzleHash(hex, "nft");
  }

  getAddress(hex: Hex0x | undefined): string {
    if (!hex) return "";
    return puzzle.getAddressFromPuzzleHash(hex, xchPrefix());
  }

  ManageCats(id: string): void {
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { account: this.account, defaultAssetId: id, defaultTab: 1 },
      events: { refresh: this.refresh },
    });
  }

  showQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineSendShowBundle,
      hasModalCard: true,
      trapFocus: false,
      props: { bundle: this.bundle },
    });
  }

  copy(text: string): void {
    store.dispatch("copy", text);
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
ol.token-list {
  margin-left: 2em;
}
img.nft-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border: 1px solid;
}

.summary-nft {
  width: 30%;
  object-fit: cover;
  border: 1px solid;
}

.break-string {
  word-break: break-word;
}
.nft-tag ::v-deep span {
  text-overflow: ellipsis;
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
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
