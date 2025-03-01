<template>
  <div class="modal-card" style="width: auto; max-width: 960px">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <top-bar :title="$t('addAccount.ui.title')" @close="close()" :showClose="true"></top-bar>

    <section class="modal-card-body">
      <!-- Step 1: Account Type Selection -->
      <div v-if="currentStep === 1">
        <b-collapse
          v-for="category in categories"
          :key="category.id"
          class="mb-4"
          animation="slide"
          :open="category.id === 'new'"
        >
          <template #trigger="props">
            <article class="media py-2" style="cursor: pointer">
              <figure class="media-left">
                <b-icon :icon="category.icon" size="is-medium"></b-icon>
              </figure>
              <div class="media-content">
                <div class="content">
                  <p class="mb-0">
                    <strong class="is-5">{{ category.name }}</strong>
                    <br />
                    <small class="has-text-grey">{{ category.description }}</small>
                  </p>
                </div>
              </div>
              <div class="media-right">
                <b-icon :icon="props.open ? 'chevron-up' : 'chevron-down'"></b-icon>
              </div>
            </article>
          </template>

          <div class="pl-5">
            <article
              v-for="type in getTypesByCategory(category.id)"
              :key="type.id"
              class="media py-2 px-2 mt-2 has-background-white-bis"
              style="cursor: pointer; border-radius: 4px"
              @click="selectType(type)"
            >
              <figure class="media-left">
                <b-icon :icon="type.icon" size="is-medium"></b-icon>
              </figure>
              <div class="media-content">
                <div class="content">
                  <p class="mb-0">
                    <strong class="is-6">{{ type.name }}</strong>
                    <br />
                    <small class="has-text-grey">{{ type.description }}</small>
                  </p>
                </div>
              </div>
            </article>
          </div>
        </b-collapse>
      </div>

      <!-- Step 2: Account Creation Form -->
      <div v-else-if="currentStep === 2" style="min-width: 300px; max-width: 500px">
        <!-- Common Name Field -->
        <b-field :label="$t('addAccount.ui.label.name')" :type="nameError ? 'is-danger' : ''" :message="nameError">
          <b-input
            ref="name"
            v-model="name"
            type="text"
            required
            maxlength="36"
            :validation-message="$t('addAccount.ui.message.nameRequired')"
          ></b-input>
        </b-field>

        <!-- Type-specific Fields -->
        <template v-if="selectedType === 'serial'">
          <!-- Serial type doesn't need additional fields -->
        </template>

        <template v-else-if="selectedType === 'password'">
          <b-field
            :label="$t('addByPassword.ui.label.password')"
            :type="passwordError ? 'is-danger' : ''"
            :message="passwordError"
          >
            <b-input
              type="password"
              v-model="password"
              password-reveal
              required
              :validation-message="$t('addByPassword.ui.message.passwordRequired')"
            ></b-input>
          </b-field>
          <b-field
            :label="$t('addByPassword.ui.label.rePassword')"
            :type="rePasswordError ? 'is-danger' : ''"
            :message="rePasswordError"
          >
            <b-input
              type="password"
              v-model="rePassword"
              password-reveal
              required
              :validation-message="$t('addByPassword.ui.message.rePasswordRequired')"
            ></b-input>
          </b-field>
        </template>

        <template v-else-if="selectedType === 'address'">
          <address-field
            :inputAddress="address"
            :validAddress="isLegalAddress"
            @updateAddress="updateAddress"
            :showAddressBook="false"
          ></address-field>
        </template>

        <template v-else-if="selectedType === 'publicKey'">
          <b-field
            :label="$t('addByPublicKey.ui.label.publicKey')"
            :type="publicKeyError ? 'is-danger' : ''"
            :message="publicKeyError"
          >
            <b-input
              v-model="publicKey"
              type="text"
              expanded
              required
              :validation-message="$t('addByPublicKey.ui.message.publicKeyRequired')"
            >
            </b-input>
            <p class="control">
              <b-button icon-left="scan-helper" @click="scanQrCode('publicKey')"></b-button>
            </p>
          </b-field>
        </template>

        <template v-else-if="selectedType === 'mpcKeys'">
          <div v-for="(publicKey, index) in mpcPublicKeys" :key="index">
            <b-field :label="$t('addByMpcKeys.ui.label.publicKey') + ' ' + (index + 1)">
              <b-input
                type="text"
                v-model="mpcPublicKeys[index]"
                expanded
                required
                :validation-message="$t('addByMpcKeys.ui.message.publicKeyRequired')"
              >
              </b-input>
              <p class="control">
                <b-button icon-left="scan-helper" @click="scanQrCode('mpcKeys', index)"></b-button>
              </p>
              <p v-if="!isLegalMpcAddresses[index]" class="help is-danger">
                {{ $t("addByMpcKeys.ui.message.illegalAddress") }}
              </p>
              <p v-if="mpcErrorMessages[index]" class="help is-danger">
                {{ mpcErrorMessages[index] }}
              </p>
            </b-field>
          </div>
          <p class="help is-danger">
            {{ $t("addByMpcKeys.ui.message.publicKeyHint") }}
            <br />
            <a :href="$tc('addByMpcKeys.ui.message.publicKeyHintLinkUrl')" target="_blank">
              {{ $t("addByMpcKeys.ui.message.publicKeyHintLinkText") }}
            </a>
          </p>
        </template>

        <template v-else-if="selectedType === 'legacy' || selectedType === 'mnemonic'">
          <b-field
            :label="$t('addByMnemonic.ui.label.mnemonic')"
            :type="mnemonicError ? 'is-danger' : ''"
            :message="mnemonicError"
          >
            <b-input
              type="textarea"
              v-model="mnemonic"
              required
              :validation-message="$t('addByMnemonic.ui.message.mnemonicRequired')"
            ></b-input>
          </b-field>
        </template>
      </div>
    </section>

    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button
        :label="currentStep === 1 ? $t('addAccount.ui.button.cancel') : $t('addAccount.ui.button.back')"
        @click="currentStep === 1 ? close() : currentStep--"
      ></b-button>
      <b-button
        v-if="currentStep === 2"
        type="is-primary"
        :label="$t('addAccount.ui.button.submit')"
        @click="submit()"
        :loading="submitting"
      ></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store/index";
import TopBar from "@/components/Common/TopBar.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import AddressField from "@/components/Common/AddressField.vue";
import { prefix0x } from "../../../../lib-chia/services/coin/condition";
import { ResolveFailureAnswer, resolveName, StandardResolveAnswer } from "@/services/api/resolveName";
import { NotificationProgrammatic as Notification } from "buefy";
import puzzle from "../../../../lib-chia/services/crypto/puzzle";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import account from "../../../../lib-chia/services/crypto/account";

interface AvailableType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  components: { TopBar, KeyBox, AddressField },
})
export default class AddAccount extends Vue {
  public currentStep = 1;
  public selectedType = "";
  public submitting = false;

  // Common fields
  public name = "";
  public nameError = "";

  // Type-specific fields
  public password = "";
  public passwordError = "";
  public rePassword = "";
  public rePasswordError = "";
  public address = "";
  public addressError = "";
  public publicKey = "";
  public publicKeyError = "";
  public mpcKeysError = "";
  public mnemonic = "";
  public mnemonicError = "";

  // MPC Keys specific fields
  public mpcPublicKeys: string[] = ["", ""];
  public mpcErrorMessages: string[] = ["", ""];
  public isLegalMpcAddresses: boolean[] = [true, true];
  public loading = false;
  public resolveAnswers: (StandardResolveAnswer | ResolveFailureAnswer | null)[] = [null, null];

  public isLegalAddress = true;

  get resolvedMpcPublicKeys(): string[] {
    return this.resolveAnswers.map((answer) => {
      if (answer?.status == "Found" && answer.data) return answer.data;
      return "";
    });
  }

  get availableTypes(): AvailableType[] {
    const types: AvailableType[] = [
      {
        id: "serial",
        name: this.$tc("accountManagement.ui.button.addBySerial"),
        description: this.$tc("accountManagement.ui.tooltip.addBySerial"),
        icon: "wallet-plus",
        category: "new",
      },
      {
        id: "password",
        name: this.$tc("accountManagement.ui.button.addByPassword"),
        description: this.$tc("accountManagement.ui.tooltip.addByPassword"),
        icon: "key",
        category: "new",
      },
      {
        id: "publicKey",
        name: this.$tc("accountManagement.ui.button.addByPublicKey"),
        description: this.$tc("accountManagement.ui.tooltip.addByPublicKey"),
        icon: "key-variant",
        category: "observation",
      },
      {
        id: "legacy",
        name: this.$tc("accountManagement.ui.button.addByLegacy"),
        description: this.$tc("accountManagement.ui.tooltip.addByLegacy"),
        icon: "folder-download",
        category: "import",
      },
      {
        id: "mnemonic",
        name: this.$tc("accountManagement.ui.button.addByMnemonic"),
        description: this.$tc("accountManagement.ui.tooltip.addByMnemonic"),
        icon: "text-box",
        category: "import",
      },
      {
        id: "address",
        name: this.$tc("accountManagement.ui.button.addByAddress"),
        description: this.$tc("accountManagement.ui.tooltip.addByAddress"),
        icon: "eye-outline",
        category: "observation",
      },
    ];

    if (store.state.vault.experiment) {
      types.push({
        id: "mpcKeys",
        name: this.$tc("accountManagement.ui.button.addByMpcKeys"),
        description: this.$tc("accountManagement.ui.tooltip.addByMpcKeys"),
        icon: "key-chain-variant",
        category: "experimental",
      });
    }

    return types;
  }

  get categories(): Category[] {
    return [
      {
        id: "new",
        name: this.$tc("accountManagement.ui.button.addAccount"),
        description: this.$tc("accountManagement.ui.tooltip.addAccount"),
        icon: "plus-thick",
      },
      {
        id: "import",
        name: this.$tc("accountManagement.ui.button.importAccount"),
        description: this.$tc("accountManagement.ui.tooltip.importAccount"),
        icon: "import",
      },
      {
        id: "observation",
        name: this.$tc("accountManagement.ui.button.observationMode"),
        description: this.$tc("accountManagement.ui.tooltip.observationMode"),
        icon: "eye",
      },
      ...(store.state.vault.experiment
        ? [
            {
              id: "experimental",
              name: this.$tc("accountManagement.ui.button.experimental"),
              description: this.$tc("accountManagement.ui.tooltip.experimental"),
              icon: "flask",
            },
          ]
        : []),
    ];
  }

  getTypesByCategory(category: string): AvailableType[] {
    return this.availableTypes.filter((type) => type.category === category);
  }

  mounted(): void {
    if (this.currentStep === 2) {
      const accNameInput = this.$refs.name as HTMLInputElement | undefined;
      if (accNameInput) {
        accNameInput.focus();
      }
    }
  }

  selectType(type: AvailableType): void {
    this.selectedType = type.id;

    // Find a unique account name
    let n = 1;
    let proposedName = "";

    do {
      proposedName = this.$t("accountManagement.ui.value.defaultName", { n: n.toString() }) as string;
      n++;
    } while (store.state.account.accounts.some((acc) => acc.name === proposedName));

    this.name = proposedName;

    this.currentStep++;
    this.$nextTick(() => {
      const accNameInput = this.$refs.name as HTMLInputElement | undefined;
      if (accNameInput) {
        accNameInput.focus();
      }
    });
  }

  close(): void {
    this.$emit("close");
  }

  validateName(): boolean {
    this.nameError = "";
    if (!this.name) {
      this.nameError = this.$tc("addAccount.ui.message.nameRequired");
      return false;
    }
    for (const acc of store.state.account.accounts) {
      if (acc.name === this.name) {
        this.nameError = this.$tc("addAccount.ui.message.duplicateName");
        return false;
      }
    }
    return true;
  }

  async submit(): Promise<void> {
    if (!this.validateName()) return;

    // Check for duplicate name
    for (const acc of store.state.account.accounts) {
      if (acc.name === this.name) {
        this.nameError = this.$tc("addByAddress.ui.message.duplicateName");
        return;
      }
    }

    this.submitting = true;
    try {
      switch (this.selectedType) {
        case "serial":
          await store.dispatch("createAccountBySerial", this.name);
          break;
        case "password":
          if (!this.password) {
            this.passwordError = this.$tc("addByPassword.ui.message.passwordRequired");
            return;
          }
          if (this.password !== this.rePassword) {
            this.passwordError = this.$tc("addByPassword.ui.message.invalidPassword");
            return;
          }
          var passwordAcc = await account.getAccount(store.state.vault.seedMnemonic, this.password);
          var duplicatePassword = store.state.account.accounts.find((a) => a.key.fingerprint === passwordAcc.fingerprint);
          if (duplicatePassword) {
            this.$buefy.dialog.alert(
              this.$tc("addByPassword.message.error.accountPasswordExists", undefined, { accName: duplicatePassword.name })
            );
            return;
          }
          await store.dispatch("createAccountByPassword", { name: this.name, password: this.password });
          break;
        case "address":
          if (!this.address) {
            this.addressError = this.$tc("addByAddress.ui.message.addressRequired");
            return;
          }
          try {
            Bytes.from(bech32m.decodeToBytes(this.address).bytes).hex();
          } catch (error) {
            this.addressError = this.$tc("addByAddress.ui.message.illegalAddress");
            return;
          }
          for (const acc of store.state.account.accounts) {
            if (acc.type === "Address" && acc.firstAddress === this.address) {
              this.addressError = this.$tc("addByAddress.ui.message.duplicateAddress", undefined, { accName: acc.name });
              return;
            }
          }
          var puzzleHash = puzzle.getPuzzleHashFromAddress(this.address);
          await store.dispatch("createAccountByAddress", { name: this.name, puzzleHash });
          break;
        case "publicKey":
          if (!this.publicKey) {
            this.publicKeyError = this.$tc("addByPublicKey.ui.message.publicKeyRequired");
            return;
          }
          for (const acc of store.state.account.accounts) {
            if (acc.type === "PublicKey" && acc.key.publicKey === prefix0x(this.publicKey)) {
              this.publicKeyError = this.$tc("addByAddress.ui.message.duplicatePublicKey", undefined, { accName: acc.name });
              return;
            }
          }
          await store.dispatch("createAccountByPublicKey", { name: this.name, publicKey: prefix0x(this.publicKey) });
          break;
        case "mpcKeys":
          if (!this.mpcPublicKeys.some((key) => key === "")) {
            let publicKeys = this.mpcPublicKeys.map((key, index) => {
              if (this.resolvedMpcPublicKeys[index]) return this.resolvedMpcPublicKeys[index];
              return prefix0x(key);
            });

            for (const acc of store.state.account.accounts) {
              if (acc.type === "2-2Keys" && publicKeys.some((key) => acc.key.publicKey === prefix0x(key))) {
                const index = publicKeys.findIndex((key) => acc.key.publicKey === prefix0x(key));
                this.isLegalMpcAddresses[index] = false;
                this.mpcErrorMessages[index] = this.$tc("addByAddress.ui.message.duplicatePublicKey", undefined, {
                  accName: acc.name,
                });
                return;
              }
            }

            await store.dispatch("createAccountByMpcKeys", { name: this.name, publicKeys: publicKeys });
          } else {
            this.mpcKeysError = this.$tc("addByMpcKeys.ui.message.mpcKeysRequired");
            return;
          }
          break;
        case "legacy":
        case "mnemonic":
          if (!this.mnemonic) {
            this.mnemonicError = this.$tc("addByMnemonic.ui.message.mnemonicRequired");
            return;
          }
          this.mnemonic = this.mnemonic.replace(/\s+/g, " ").trim();
          var mnemonicAcc = await account.getAccount("", null, this.mnemonic);
          if (store.state.account.accounts.find((a) => a.key.fingerprint === mnemonicAcc.fingerprint)) {
            this.$buefy.dialog.alert(this.$tc("addByMnemonic.message.error.accountMnemonicExists"));
            return;
          }
          await store.dispatch("createAccountByLegacyMnemonic", {
            name: this.name,
            legacyMnemonic: this.mnemonic,
          });
          break;
      }
      this.close();
    } catch (error) {
      Notification.open({
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        type: "is-danger",
      });
    } finally {
      this.submitting = false;
    }
  }

  async resetMpc(index: number): Promise<void> {
    if (this.mpcPublicKeys[index].match(/[a-zA-Z0-9-]{4,}\.xch$/)) {
      this.loading = true;
      this.resolveAnswers[index] = await resolveName(this.mpcPublicKeys[index], "publicKey");
      this.loading = false;
    } else {
      this.mpcErrorMessages[index] = "";
      this.isLegalMpcAddresses[index] = true;
      this.resolveAnswers[index] = null;
    }
  }

  async scanQrCode(type: "address" | "publicKey" | "mpcKeys", index?: number): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Common/ScanQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          switch (type) {
            case "address":
              this.address = value;
              break;
            case "publicKey":
              this.publicKey = value;
              break;
            case "mpcKeys":
              if (index !== undefined) {
                this.$set(this.mpcPublicKeys, index, value);
              }
              break;
          }
        },
      },
    });
  }

  updateAddress(value: string): void {
    this.address = value;
    this.addressError = "";
    this.isLegalAddress = true;
  }
}
</script>

<style scoped>
.account-type-box {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.account-type-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
}

.account-type-box.is-selected {
  border: 2px solid #00d1b2;
  background-color: #f5fffd;
}
</style>
