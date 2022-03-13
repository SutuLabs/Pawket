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
            <li>{{ sumkey }}</li>
            <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
              <b-taglist attached>
                <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + '(' + ent.id + ')'">{{
                  cats[ent.id]
                }}</b-tag>
                <b-tag v-else-if="ent.id" type="is-info" :title="ent.id">CAT {{ ent.id.slice(0, 7) + "..." }}</b-tag>
                <b-tag v-else type="is-info">XCH</b-tag>

                <b-tag type="">{{ ent.amount }}</b-tag>
                <b-tag type="is-info is-light" :title="ent.target">{{ ent.target.slice(0, 7) + "..." }}</b-tag>
              </b-taglist>
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
import offer, { OfferSummary } from "@/services/transfer/offer";
import { AccountEntity } from "@/store/modules/account";
import { prefix0x } from "@/services/coin/condition";

@Component({
  components: {
    KeyBox,
  },
})
export default class TakeOffer extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() private inputOfferText!: string;
  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public submitting = false;
  public bundle: SpendBundle | null = null;

  get bundleText(): string {
    return this.offerBundle == null ? "" : JSON.stringify(this.offerBundle);
  }

  @Emit("close")
  close(): void {
    return;
  }

  get cats(): { [id: string]: string } {
    return Object.assign({}, ...this.account.cats.map((_) => ({ [prefix0x(_.id)]: _.name })));
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

<style scoped lang="scss"></style>
