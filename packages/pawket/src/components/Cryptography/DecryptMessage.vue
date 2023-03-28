<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("decryptMessage.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('decryptMessage.ui.label.message')">
        <b-input type="textarea" v-model="message" rows="18"></b-input>
      </b-field>

      <b-field v-if="decryptedMessage" :label="$t('decryptMessage.ui.label.result')">
        <template #message>
          <pre>{{ decryptedMessage }}</pre>
        </template>
      </b-field>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="decryptedMessage ? 'Back' : 'Cancel'" class="is-pulled-left" @click="cancel()"></b-button>
      </div>
      <div>
        <b-button
          :label="$t('decryptMessage.ui.button.decrypt')"
          type="is-primary"
          class="is-pulled-right"
          @click="decrypt()"
          :loading="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import puzzle from "@/services/crypto/puzzle";
import { rpcUrl } from "@/store/modules/network";
import { AccountEntity } from "@/models/account";
import { EcdhHelper } from "@/services/crypto/ecdh";
import { prefix0x } from "@/services/coin/condition";

@Component({
  components: {
    KeyBox,
  },
})
export default class DecryptMessage extends Vue {
  @Prop() public initMessage!: string | undefined;
  @Prop() public account!: AccountEntity;

  public submitting = false;
  public message = "";
  public decryptedMessage = "";
  private privateKey = "";

  async mounted(): Promise<void> {
    this.message = this.initMessage || this.message;
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
    if (this.path.endsWith("decrypt-message")) this.$router.back();
    return;
  }

  reset(): void {
    this.decryptedMessage = "";
  }

  cancel(): void {
    if (this.decryptedMessage) {
      this.reset();
    } else {
      this.$router.push("/home");
    }
  }

  async decrypt(): Promise<void> {
    this.submitting = true;
    try {
      const ecdh = new EcdhHelper();
      this.decryptedMessage = "";

      const kvp = this.message
        .split("\n")
        .filter((_) => _.indexOf(":") > -1)
        .map((_) => ({ key: _.substring(0, _.indexOf(":")), value: _.substring(_.indexOf(":") + 2).trim() }));

      const addressFrom = kvp.find((_) => _.key == "Sender Address")?.value;
      const addressSelf = kvp.find((_) => _.key == "Receiver Address")?.value;
      const encmsg = kvp.find((_) => _.key == "Encrypted Message")?.value;

      if (!addressFrom || !addressSelf || !encmsg) {
        Notification.open({
          message: "malformat.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const phFrom = prefix0x(puzzle.getPuzzleHashFromAddress(addressFrom));
      const phSelf = prefix0x(puzzle.getPuzzleHashFromAddress(addressSelf));

      const dec = await ecdh.decrypt(phFrom, phSelf, encmsg, this.account, rpcUrl());
      this.decryptedMessage = dec;
    } catch (error) {
      const err = String(error);
      if (err.match(/Cannot find the address/)) {
        Notification.open({
          message: this.$tc("decryptMessage.message.error.CANNOT_FIND_ADDRESS"),
          type: "is-danger",
          autoClose: false,
        });
      } else if (err.match(/OperationError/)) {
        Notification.open({
          message: this.$tc("decryptMessage.message.error.INVALID_MESSAGE"),
          type: "is-danger",
          autoClose: false,
        });
      } else if (err.match(/Invalid checksum/)) {
        Notification.open({
          message: this.$tc("decryptMessage.message.error.INVALID_ADDRESS"),
          type: "is-danger",
          autoClose: false,
        });
      } else {
        Notification.open({
          message: this.$tc("batchSend.ui.messages.failedToSign") + error,
          type: "is-danger",
          autoClose: false,
        });
        console.warn(error);
      }
    }

    this.submitting = false;
  }
}
</script>

<style scoped lang="scss">
::v-deep textarea {
  font-size: 0.7em;
  font-family: monospace;
}
</style>
