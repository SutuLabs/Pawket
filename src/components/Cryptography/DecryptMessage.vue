<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("decryptMessage.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('decryptMessage.ui.label.publicKey')">
        <key-box
          icon="checkbox-multiple-blank-outline"
          :value="pubKey"
          :tooltip="pubKey"
          :showValue="true"
          :headLength="80"
          :tailLength="10"
        ></key-box>
      </b-field>

      <b-field :label="$t('decryptMessage.ui.label.message')">
        <b-input type="textarea" v-model="message" rows="18"></b-input>
      </b-field>

      <b-field v-if="decryptedMessage" :label="$t('decryptMessage.ui.label.result')">
        <template #message>
          {{ decryptedMessage }}
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
import { xchSymbol } from "@/store/modules/network";
import utility from "@/services/crypto/utility";
import { AccountEntity } from "@/models/account";
import { CryptographyService } from "@/services/crypto/encryption";
import { Bytes } from "clvm";
import { bech32m } from "@scure/base";

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
  public pubKey = "";
  public decryptedMessage = "";
  private privateKey = "";

  async mounted(): Promise<void> {
    this.message = this.initMessage || this.message;
    const puz = this.account.addressPuzzles.find((_) => _.symbol == xchSymbol())?.puzzles[0];
    const ecc = new CryptographyService();
    if (puz) {
      const sk = utility.toHexString(puz.privateKey.serialize());
      this.privateKey = sk;
      this.pubKey = puzzle.getAddressFromPuzzleHash(ecc.getPublicKey(sk).toHex(), "curve25519");
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
      this.decryptedMessage = "";

      const kvp = this.message
        .split("\n")
        .filter((_) => _.indexOf(":") > -1)
        .map((_) => ({ key: _.substring(0, _.indexOf(":")), value: _.substring(_.indexOf(":") + 2).trim() }));

      const pk = kvp.find((_) => _.key == "Sender Public Key")?.value;
      const selfpk = kvp.find((_) => _.key == "Receiver Public Key")?.value;
      const encmsg = kvp.find((_) => _.key == "Encrypted Message")?.value;

      if (!pk || !selfpk || !encmsg) {
        Notification.open({
          message: "malformat.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      if (selfpk != this.pubKey) {
        Notification.open({
          message: "wrong pk.",
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const ecc = new CryptographyService();
      const pkhex = Bytes.from(bech32m.decodeToBytes(pk).bytes).hex();
      const dec = await ecc.decrypt(encmsg, pkhex, this.privateKey);
      this.decryptedMessage = dec;
    } catch (error) {
      Notification.open({
        message: this.$tc("batchSend.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
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
