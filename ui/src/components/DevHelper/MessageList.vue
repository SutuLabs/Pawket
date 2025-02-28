<template>
  <div>
    <h3 v-if="messageSend.length > 0">{{ title }}</h3>
    <ul v-if="messageSend.length > 0" class="args_list ellipsis-item">
      <li v-for="(message, i) in messageSend" :key="i" :title="message.message">
        <b-button tag="a" size="is-small" @click="changeCoin(message.coinIndex)">
          {{ message.coinIndex }}
        </b-button>

        <span v-for="(asserted, idx) in [messageReceive.filter((_) => _.message == message.message)[0]]" :key="idx">
          <b-tag v-if="asserted" type="is-info is-light">➡️</b-tag>
          <b-button v-if="asserted" tag="a" size="is-small" @click="changeCoin(asserted.coinIndex)">
            {{ asserted.coinIndex }}
          </b-button>
        </span>
        <b-tag v-if="messageReceive.findIndex((_) => _.message == message.message) == -1" type="is-warning is-light"
          >No Assert</b-tag
        >

        <span class="mid-message">
          {{ message.message }}
        </span>

        <MessageIndicator :mode="message.mode"></MessageIndicator>
      </li>
    </ul>
    <ul v-if="messageReceive.length > 0" class="args_list ellipsis-item">
      <li
        v-for="(message, i) in messageReceive.filter((_) => !messageSend.some((p) => p.message == _.message))"
        :key="i"
        :title="message.message"
      >
        <b-button tag="a" size="is-small" @click="changeCoin(message.coinIndex)">
          {{ message.coinIndex }}
        </b-button>

        <b-tag type="is-warning is-light">Not Created</b-tag>

        <span class="mid-message is-danger">
          {{ message.message }}
        </span>
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
