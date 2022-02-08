<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t('message.send') }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('message.address')">
        <b-input> </b-input>
      </b-field>
      <b-field :label="$t('message.amount')" :message="amountMessage">
        <b-select :value="'XCH'">
          <option>XCH</option>
          <option>BSH</option>
          <option>SBX</option>
          <option>CH21</option>
        </b-select>
        <b-input v-model="amount" expanded></b-input>
        <p class="control">
          <span class="button is-static">XCH</span>
        </p>
      </b-field>
      <b-field :label="$t('message.memo')">
        <b-input maxlength="100" type="text"></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <b-button :label="$t('message.cancel')" @click="close()"></b-button>
      <b-button :label="$t('message.submit')" type="is-primary" @click="submit()" :disabled="submitting"></b-button>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { Account } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";

@Component({
  components: {
    KeyBox,
  },
})
export default class Send extends Vue {
  @Prop() private account!: Account;
  public amount: number | null = null;
  public submitting = false;

  @Emit("close")
  close(): void {
    return;
  }

  get amountMessage(): string {
    if (!this.amount) return "";
    function numberWithCommas(x: number): string {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return numberWithCommas(this.amount * Math.pow(10, 12)) + " mojos";
  }

  submit(): void {
    this.submitting = true;
    setTimeout(() => {
      this.submitting = false;
      Notification.open({
        message: `Subbmitted to memory pool.`,
        type: "is-success",
      });

      this.close();
    }, 2000);
  }
}
</script>

<style scoped lang="scss"></style>
