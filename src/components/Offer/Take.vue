<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Take Offer</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field label="Offer" :message="offerText ? '' : 'paste offer here, e.g. offer1...'">
        <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
      </b-field>
      <b-field v-if="summary" label="Information">
        <template #message>
          <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
            <li v-if="sumkey == 'requested'">In exchange for</li>
            <li v-if="sumkey == 'offered'">You will receive</li>
            <li>
              <ol class="token-list">
                <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
                  <b-taglist attached>
                    <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                      cats[ent.id]
                    }}</b-tag>
                    <b-tag v-else-if="ent.id" type="is-info" :title="ent.id">CAT {{ ent.id.slice(0, 7) + "..." }}</b-tag>
                    <b-tag v-else type="is-info" title="Original XCH">XCH</b-tag>

                    <b-tag class="" :title="ent.amount + ' mojos'">{{
                      ent.amount | demojo(ent.id && tokenInfo[cats[ent.id]])
                    }}</b-tag>
                    <b-tag v-if="sumkey == 'requested'" type="is-info is-light" :title="ent.target">{{
                      ent.target.slice(0, 10) + "..."
                    }}</b-tag>
                  </b-taglist>
                </li>
              </ol>
            </li>
          </ul>
        </template>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" @click="close()"></b-button>
        <b-button
          :label="$t('send.ui.button.sign')"
          v-if="!bundle"
          type="is-success"
          @click="sign()"
          :disabled="submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('send.ui.button.submit')"
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
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import offer, { getCatIdDict, getCatNameDict, getTokenInfo, OfferSummary } from "@/services/transfer/offer";
import { AccountEntity, TokenInfo } from "@/store/modules/account";
import { demojo } from "@/filters/unitConversion";

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo },
})
export default class TakeOffer extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop({
    default:
      "offer1qqp83w76wzru6cmqvpsxygqqama36ngn6fhxtlen3xthnqm0s83gfww3vu3ld0vat8yt6ukl6tlwnhpswkcxq8dduarwhww30fhtf8sm4hnsdw57qvthkzu2acw5s6hhh9e8n4vwfy9jdfr493ww02xdequ5xnmultpg9dfhhthaeqf2ewf3qlt8lnfrj00038u39m26u5umc8r2zd2p48su46g8lemd2sne6rfdg3r7knncj78pzg4nvzr99k5hq5nnf87vadw0dk57a4y0tamaxvwvl0dsnygj873h9geldnel5zfqjat8es0vthvmjfmywasn0ldcmarw4lqzae7q44qm7f0h987vjk3npk2gvzf2qfvhwfflhex74d0yutlnm4dm3dtcjnllmf42ed7rehvrvcxj7yau0ge7kygryq662le6x4xkcwua7rfk0rplvscaahta9ajf749znz05lnl2zxwy66lvxemxdhtpvr5kh7tea8nrew48qt25tjf8ank9dwty2hf06dttp4sxfz90a0mq6u3u0f8h00pl5wlh2jvmpn6cymv0kstzmm8vw0ej408jm2h68xlmlu3lxzqcr4q333j3dgp6l0lskdhu0hjlpm6djr75duff5kannl7897tglhan38nadmumw0ng40rj20uqkr4p48a2ax77mk088ekxx6h6c6a4nafy2eadhzteej07ls6el7fhheackkjdyuncs2k0zyf0mwer59n05s2hz9rdz4l8nnkd3sjk4tremwtjw5mf82n45w57rec06a2ejft83rmz6wmawfxl4nazg6x4lutkh0vv6979y5psq2q0hlfscgd2p5",
  })
  private inputOfferText!: string;
  // @Prop() private inputOfferText!: string;
  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public submitting = false;
  public bundle: SpendBundle | null = null;

  @Emit("close")
  close(): void {
    return;
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

  mounted(): void {
    if (this.inputOfferText) {
      this.offerText = this.inputOfferText;
      this.updateOffer();
    }
  }

  async updateOffer(): Promise<void> {
    this.offerBundle = null;
    this.offerBundle = await offer.decode(this.offerText);
    this.summary = null;
    this.summary = await offer.getSummary(this.offerBundle);
  }
}
</script>

<style scoped lang="scss">
ol.token-list {
  margin-left: 2em;
}
</style>
