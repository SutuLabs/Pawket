<template>
  <div class="modal-card" @dragenter="dragenter" @dragleave="dragleave">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("encryptMessage.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-tabs position="is-centered" expanded v-if="!result" @input="reset()">
        <b-tab-item :label="$t('encryptMessage.ui.tab.singleMessage')">
          <template v-if="!result">
            <b-field :label="$t('encryptMessage.ui.label.encryptWithAddress')">
              <key-box
                icon="checkbox-multiple-blank-outline"
                :value="account.firstAddress"
                :tooltip="account.firstAddress"
                :showValue="true"
                :headLength="80"
                :tailLength="10"
              ></key-box>
            </b-field>
            <b-field v-if="!isActivated && !refreshing">
              <p class="has-text-danger">
                {{ $t("encryptMessage.ui.label.activatePrefix")
                }}<u class="is-clickable" @click="activate()">{{ $t("encryptMessage.ui.label.activate") }}</u>
              </p>
            </b-field>
            <address-field
              :inputAddress="address"
              :validAddress="validAddress"
              :label="$t('encryptMessage.ui.label.receiverAddress')"
              :addressEditable="true"
              @updateAddress="updateAddress"
              @updateEffectiveAddress="updateEffectiveAddress"
            ></address-field>
            <b-field :label="$t('encryptMessage.ui.label.message')">
              <b-input v-model="message" type="textarea" required ref="message"></b-input>
            </b-field>
          </template>
        </b-tab-item>
        <b-tab-item :label="$t('encryptMessage.ui.tab.multipleMessage')">
          <template v-if="!result">
            <b-field :label="$t('encryptMessage.ui.label.encryptWithAddress')">
              <key-box
                icon="checkbox-multiple-blank-outline"
                :value="account.firstAddress"
                :tooltip="account.firstAddress"
                :showValue="true"
                :headLength="80"
                :tailLength="10"
              ></key-box
            ></b-field>
            <b-field v-if="!isActivated && !refreshing">
              <p class="has-text-danger">
                {{ $t("encryptMessage.ui.label.activatePrefix")
                }}<u class="is-clickable" @click="activate()">{{ $t("encryptMessage.ui.label.activate") }}</u>
              </p>
            </b-field>
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
              <b-input type="textarea" v-model="csv" v-show="!isDragging" required ref="csv"></b-input>
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
          </template>
        </b-tab-item>
      </b-tabs>
      <template v-if="result">
        <b-input type="textarea" v-model="result" rows="18"></b-input>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button v-if="!result" :label="$t('common.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button v-if="result" :label="$t('common.button.back')" class="is-pulled-left" @click="back()"></b-button>
      </div>
      <div>
        <b-button
          :label="$t('encryptMessage.ui.button.encrypt')"
          v-if="!result"
          class="is-pulled-right"
          type="is-primary"
          @click="toEncrypt()"
          :loading="submitting"
          :disabled="submitting || (!refreshing && !isActivated)"
        ></b-button>
        <b-button
          :label="$t('common.button.copy')"
          v-if="result"
          type="is-primary"
          class="is-pulled-right"
          @click="copy()"
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
import { DidDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import puzzle from "@/services/crypto/puzzle";
import { csvToArray } from "@/services/util/csv";
import { rpcUrl } from "@/store/modules/network";
import store from "@/store";
import { prefix0x } from "@/services/coin/condition";
import { EcdhHelper } from "@/services/crypto/ecdh";
import AddressField, { resolveName } from "@/components/Common/AddressField.vue";
import Send from "../Send/Send.vue";
import { isMobile } from "@/services/view/responsive";
import { bech32m } from "@scure/base";

@Component({
  components: {
    KeyBox,
    AddressField,
  },
})
export default class EncryptMessage extends Vue {
  @Prop() public account!: AccountEntity;

  public submitting = false;
  public fee = 0;
  public csv = "";
  public file: File | null = null;
  public dragfile: File[] = [];
  public isDragging = false;
  public transitioning = false;
  public result = "";
  public message = "";

  public requests: TokenPuzzleDetail[] = [];
  public selectedDid: DidDetail | null = null;

  public validAddress = true;
  public address = "";
  public signAddress = "";

  get dids(): DidDetail[] {
    return this.account.dids || [];
  }

  get isActivated(): boolean {
    if (this.account.activities && this.account.activities.find((act) => act.spent == true)) return true;
    return false;
  }

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  mounted(): void {
    if (!this.account.dids) {
      store.dispatch("refreshDids");
    }
  }

  activate(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: {
        account: this.account,
        inputAddress: this.account.firstAddress,
        addressEditable: false,
      },
    });
  }

  reset(): void {
    this.csv = "";
    this.file = null;
    this.dragfile = [];
    this.signAddress = "";
    this.address = "";
    this.message = "";
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
    if (this.path.endsWith("encrypt-message")) this.$router.back();
    return;
  }

  back(): void {
    this.result = "";
    this.selectedDid = null;
    this.reset();
  }

  cancel(): void {
    this.$router.push("/home");
  }

  validate(): boolean {
    if (!this.address) {
      this.validAddress = false;
      return false;
    }
    try {
      bech32m.decodeToBytes(this.address);
    } catch (error) {
      this.validAddress = false;
    }
    return (this.$refs.message as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async toEncrypt(): Promise<void> {
    if (this.csv) {
      const inputs = csvToArray(this.csv);
      this.encrypt(inputs);
    } else {
      if (!this.validate()) {
        (this.$refs.csv as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
        return;
      }
      this.encrypt([[this.address, this.signAddress, this.message]]);
    }
  }

  async encrypt(inputs: string[][]): Promise<void> {
    this.submitting = true;
    try {
      const ecdh = new EcdhHelper();
      let result = "";
      const myAddress = this.account.firstAddress;
      if (!myAddress) {
        this.submitting = false;
        return;
      }
      const myPh = prefix0x(puzzle.getPuzzleHashFromAddress(myAddress));

      for (let i = 0; i < inputs.length; i++) {
        const pars = inputs[i];
        const comment = pars[0];
        const address = pars[1];
        let xchAddress = address;
        // address can be CNS, should resolve before proceeding
        if (address.match(/[a-zA-Z0-9-]{4,}\.xch$/)) {
          const resolveAnswer = await resolveName(address);
          if (resolveAnswer.status == "Found" && resolveAnswer.data)
            xchAddress = puzzle.getAddressFromPuzzleHash(resolveAnswer.data, "xch");
        }
        const ph = prefix0x(puzzle.getPuzzleHashFromAddress(xchAddress));
        const msg = pars[2];

        const enc = await ecdh.encrypt(myPh, ph, msg, this.account, rpcUrl());
        result += `-------- ${comment} ---------
Sender Address: ${myAddress}
Receiver Address: ${xchAddress}
Encrypted Message: ${enc}
`;
      }
      this.result = result;
    } catch (error) {
      const errMsg = String(error);
      if (errMsg.match(/cannot get puzzle from coin/)) {
        Notification.open({
          message: this.$tc("encryptMessage.message.error.INACTIVE_ADDRESS"),
          type: "is-danger",
          autoClose: false,
        });
      } else {
        Notification.open({
          message: this.$tc("batchSend.ui.messages.failedToSign") + error,
          type: "is-danger",
          autoClose: false,
        });
      }
      this.submitting = false;
      return;
    }
    this.reset();
    this.submitting = false;
  }

  get csvSampleUri(): string {
    const dataPrefix = "data:text/csv;charset=utf-8";
    const content = `
${dataPrefix},target1,hann.xch,message1
target2,xch10mwmd3pywc4h5yqgmdqmfwdxpayvec3ptc8rq06kkwnxe6x6jkvqhca5gs,message2
`.trim();
    return encodeURI(content);
  }

  fillSample(): void {
    this.csv = `
target1,hann.xch,message1
target2,xch10mwmd3pywc4h5yqgmdqmfwdxpayvec3ptc8rq06kkwnxe6x6jkvqhca5gs,message2
`.trim();
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

  copy(): void {
    store.dispatch("copy", this.result);
  }

  updateEffectiveAddress(value: string): void {
    this.signAddress = value;
  }

  updateAddress(value: string): void {
    this.address = value;
    this.validAddress = true;
  }
}
</script>

<style scoped lang="scss">
::v-deep textarea {
  font-size: 0.8em;
}
</style>
