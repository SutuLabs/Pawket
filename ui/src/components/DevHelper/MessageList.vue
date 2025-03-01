<template>
  <div>
    <h3 v-if="messageSend.length > 0">{{ title }}</h3>
    <ul v-if="messageSend.length > 0" class="args_list ellipsis-item">
      <li v-for="(message, i) in messageSend" :key="i" :title="message.message">
        <b-button tag="a" size="is-small" @click="changeCoin(message.coinIndex)">
          {{ message.coinIndex }}
        </b-button>

        <b-tag type="is-info is-light">➡️</b-tag>
        <b-button v-for="(cidx, idx) in message.opponents" :key="idx" tag="a" size="is-small" @click="changeCoin(cidx)">
          {{ cidx }}
        </b-button>

        <b-tag v-if="message.opponents.length == 0" type="is-warning is-light">No Receiver</b-tag>

        <span class="mid-message">
          {{ message.message }}
        </span>

        <MessageIndicator :mode="message.mode"></MessageIndicator>
      </li>
    </ul>
    <ul v-if="messageReceive.length > 0" class="args_list ellipsis-item">
      <li v-for="(message, i) in receiverWithoutSender" :key="i" :title="message.message">
        <b-tag type="is-warning is-light">No Sender</b-tag>
        <b-tag type="is-info is-light">➡️</b-tag>

        <b-button tag="a" size="is-small" @click="changeCoin(message.coinIndex)">
          {{ message.coinIndex }}
        </b-button>

        <span class="mid-message is-danger">
          {{ message.message }}
        </span>

        <MessageIndicator :mode="message.mode"></MessageIndicator>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { CoinSpend, MessageCoin } from "../../../../lib-chia/services/spendbundle";
import MessageIndicator from "@/components/DevHelper/MessageIndicator.vue";

@Component({
  components: {
    KeyBox,
    MessageIndicator,
  },
})
export default class MessageList extends Vue {
  @Prop() public messageSend!: MessageCoin[];
  @Prop() public messageReceive!: MessageCoin[];
  @Prop() public coinSpends!: CoinSpend[];
  @Prop() public title!: string;

  get receiverWithoutSender(): MessageCoin[] {
    return this.messageReceive.filter((_) => !this.messageSend.some((p) => p.opponents.findIndex((c) => c == _.coinIndex) > -1));
  }

  changeCoin(id: number): void {
    this.$emit("changeCoin", id);
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";

ul.args_list.ellipsis-item > li .mid-message {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
}
</style>
