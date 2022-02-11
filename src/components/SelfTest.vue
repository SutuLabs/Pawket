<template>
  <div class="box" v-show="status" id="self-test">{{ errorMessage }}</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { OriginCoin } from "../models/wallet";
import utility from "@/services/crypto/utility";
import puzzle from "@/services/crypto/puzzle";
import transfer from "@/services/transfer/transfer";
import store from "@/store";
import DevHelper from "./DevHelper.vue";
import catBundle from "@/services/transfer/catBundle";
import stdBundle from "@/services/transfer/stdBundle";

enum Status {
  Checking = -1,
  Passed = 0,
  Failed = 1,
}

@Component
export default class SelfTest extends Vue {
  public status = Status.Checking;
  public errorMessage: unknown = Status[this.status];
  mounted(): void {
    this.selfTest().then(() => {
      console.log();
    });
  }

  assert<T>(expect: T, actual: T): void {
    if (expect != actual) {
      throw `asserting failed\nexpect:${expect}\nactual:${actual}`;
    }
  }

  async selfTest(): Promise<void> {
    try {
      console.log("self-test started");
      await store.dispatch("initializeBls");
      var privkey = utility.fromHexString("67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2");
      const sk = await utility.getPrivateKey(privkey);
      const masterprikey = utility.toHexString(sk.serialize());
      const masterpubkey = utility.toHexString(sk.get_g1().serialize());
      this.assert("67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2", masterprikey);
      this.assert(
        "89d4ca795881dc192cf7e0bcf22528c3d7708f57aa644647ae2506cd10405dc528b36e450ab901675f7a6289a4335a22",
        masterpubkey
      );
      this.assert("2308828858", sk.get_g1().get_fingerprint().toString());

      const derive = await utility.derive(privkey, true);
      const farmerpubkey = utility.toHexString(derive([12381, 8444, 0, 0]).get_g1().serialize());
      this.assert(
        "99f181b1b30865339eea4e61172e64282ed1793022363f6635affbfb2aa2f4384ef10df47a445f92d685c7265488777e",
        farmerpubkey
      );
      const poolpubkey = utility.toHexString(derive([12381, 8444, 1, 0]).get_g1().serialize());
      this.assert("9896eb01246db07360b4caba1861a6d13c5be923e28a68ba8429d841c5dfa429e05ef639003793c4715a8be4578abe9e", poolpubkey);
      const walletprikey = utility.toHexString(derive([12381, 8444, 2, 0]).serialize());
      this.assert("0408d4c5e7c97af49dd5605db1907a231761c0cba816c778e74c8de24d0793cd", walletprikey);
      const walletpubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
      this.assert(
        "8b58921998b2337fd9d4a410e8bd11dfda435feb92dc3d6f3e111194b99a0391f39cf9b9534a44d154c9d7492400f36b",
        walletpubkey
      );
      // });
      const adr = await puzzle.getAddress(walletpubkey, "xch");
      this.assert("xch13akv0y3er0qvdjwzks2gm4ljj7qpynrh6rcsnwc6y0hyfgzdj89sr43zcp", adr);

      const gt1 = transfer.getDelegatedPuzzle([
        ["a", "b", "c"],
        ["d", "e", "f"],
      ]);
      this.assert(`(q (a b c) (d e f))`, gt1);

      const gt2 = transfer.getDelegatedPuzzle([
        ["a", "b", "c"],
        ["d", "e", ["f", `"g"`], []],
      ]);
      this.assert(`(q (a b c) (d e (f "g") ()))`, gt2);

      await this.testStandardTransfer();
      await this.testCatTransfer();
      await this.testCatTransfer2();

      const coinname = transfer.getCoinName({
        amount: 1000000000n,
        parent_coin_info: "0xcd299604b459e5ff20da17627d684ea143fc1b5b4165166943729d2d24305de8",
        puzzle_hash: "0x484aaab0cda1b0149df9adeddb0a5d28976ad259ff6173f4488cbc68f095eb79",
      });
      this.assert("c62152493a6f3fbca7a918a8258e52f84c4e8aa286b8ebf1b0d5e5dda7fa7e6f", coinname.hex());

      if (process.env.NODE_ENV !== "production") {
        console.log("self-test passed");
      }
      this.errorMessage = Status[this.status];
      this.status = Status.Passed;
    } catch (error) {
      this.errorMessage = error;
      console.warn(error);
    }

    const enableDevHelper = false;
    if (enableDevHelper) {
      this.$buefy.modal.open({
        parent: this,
        component: DevHelper,
        hasModalCard: true,
        trapFocus: true,
        props: {},
      });
    }
  }

  async testStandardTransfer(): Promise<void> {
    const coin: OriginCoin = {
      amount: BigInt(1750000000000),
      parent_coin_info: "0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001",
      puzzle_hash: "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3",
    };
    const sk_hex = "5c3b9b1062eaefd843d79d2b53856da31521ed7d1fe2a3ec48c71e654c4530e5";
    const tgt_addr = await puzzle.getAddressFromPuzzleHash(
      "0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5",
      "xch"
    );
    const change_addr = await puzzle.getAddressFromPuzzleHash(
      "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3",
      "xch"
    );
    const puzzles = await puzzle.getPuzzleDetails(utility.fromHexString(sk_hex), 0, 5);
    const bundle = await stdBundle.generateSpendBundle([coin], puzzles, tgt_addr, 1_000_000n, 0n, change_addr);
    this.assert(
      "0x81198e68402824e0585fac43d79edf3efe19e4651747f4e9b8d28f6a8a5c319dac67d4a0c03ad957cbb7d7c3c955605d03d6c5750e0aa44baf73ddaa5fcfbe74e3cb922034b72656f0df410ff6ef8e81b56b1a6a0c9bddd9331b7a9c90f897ce",
      bundle?.aggregated_signature
    );
    this.assert(
      "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0a042c855d234578415254b7870b711fb25e8f85beaa4a66bd0673d394c761fa156406c2e3bb375d5b18766d2a12cc918ff018080",
      bundle?.coin_spends[0].puzzle_reveal
    );
    this.assert(
      "0xff80ffff01ffff33ffa087908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5ff830f424080ffff33ffa04f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3ff860197741199c08080ff8080",
      bundle?.coin_spends[0].solution
    );
  }

  async testCatTransfer(): Promise<void> {
    const coin: OriginCoin = {
      amount: 9799n,
      parent_coin_info: "0x979cea91ab150d99211b9e5705b088c7807aac849d494fecf0419a382fe361f7",
      puzzle_hash: "0xce8a53f46946e5c5e2aa835d700745d9be3879bc5f6a029a965b7663a5c1f74c",
    };
    const sk_hex = "40fbb0dad159776ed05afbaeac4f4fe1b975e93bf5e9dda9fbf4e375346d12a0";
    const tgt_addr = await puzzle.getAddressFromPuzzleHash(
      "0x3eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc0",
      "xch"
    );
    const change_addr = await puzzle.getAddressFromPuzzleHash(
      "0x1cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce",
      "xch"
    );
    const assetId = "78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1";
    const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, 0, 5);

    const bundle = await catBundle.generateCatSpendBundle([coin], puzzles, tgt_addr, 300n, 0n, change_addr, null);
    this.assert(
      "0xa2b3ea73ce4c16248e6b57fb72498d95881866fce4651aeba3b98e1c287700b35aebba853f11d4c7fef14d3381c6172d1847796d44b3f4c5f9ed42315a53694b9b849f4b28690fcb553617d0b7f1b9080dc060f6ac0ad4eb34661bce37e92a40",
      bundle?.aggregated_signature
    );
    this.assert(
      "0xff02ffff01ff02ffff01ff02ff5effff04ff02ffff04ffff04ff05ffff04ffff0bff2cff0580ffff04ff0bff80808080ffff04ffff02ff17ff2f80ffff04ff5fffff04ffff02ff2effff04ff02ffff04ff17ff80808080ffff04ffff0bff82027fff82057fff820b7f80ffff04ff81bfffff04ff82017fffff04ff8202ffffff04ff8205ffffff04ff820bffff80808080808080808080808080ffff04ffff01ffffffff81ca3dff46ff0233ffff3c04ff01ff0181cbffffff02ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff22ffff0bff2cff3480ffff0bff22ffff0bff22ffff0bff2cff5c80ff0980ffff0bff22ff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ff0bffff01ff02ffff03ffff09ffff02ff2effff04ff02ffff04ff13ff80808080ff820b9f80ffff01ff02ff26ffff04ff02ffff04ffff02ff13ffff04ff5fffff04ff17ffff04ff2fffff04ff81bfffff04ff82017fffff04ff1bff8080808080808080ffff04ff82017fff8080808080ffff01ff088080ff0180ffff01ff02ffff03ff17ffff01ff02ffff03ffff20ff81bf80ffff0182017fffff01ff088080ff0180ffff01ff088080ff018080ff0180ffff04ffff04ff05ff2780ffff04ffff10ff0bff5780ff778080ff02ffff03ff05ffff01ff02ffff03ffff09ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff01818f80ffff01ff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ffff04ff81b9ff82017980ff808080808080ffff01ff02ff5affff04ff02ffff04ffff02ffff03ffff09ff11ff7880ffff01ff04ff78ffff04ffff02ff36ffff04ff02ffff04ff13ffff04ff29ffff04ffff0bff2cff5b80ffff04ff2bff80808080808080ff398080ffff01ff02ffff03ffff09ff11ff2480ffff01ff04ff24ffff04ffff0bff20ff2980ff398080ffff010980ff018080ff0180ffff04ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff04ffff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ff17ff808080808080ff80808080808080ff0180ffff01ff04ff80ffff04ff80ff17808080ff0180ffffff02ffff03ff05ffff01ff04ff09ffff02ff26ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff0bff22ffff0bff2cff5880ffff0bff22ffff0bff22ffff0bff2cff5c80ff0580ffff0bff22ffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bff2cff058080ff0180ffff04ffff04ff28ffff04ff5fff808080ffff02ff7effff04ff02ffff04ffff04ffff04ff2fff0580ffff04ff5fff82017f8080ffff04ffff02ff7affff04ff02ffff04ff0bffff04ff05ffff01ff808080808080ffff04ff17ffff04ff81bfffff04ff82017fffff04ffff0bff8204ffffff02ff36ffff04ff02ffff04ff09ffff04ff820affffff04ffff0bff2cff2d80ffff04ff15ff80808080808080ff8216ff80ffff04ff8205ffffff04ff820bffff808080808080808080808080ff02ff2affff04ff02ffff04ff5fffff04ff3bffff04ffff02ffff03ff17ffff01ff09ff2dffff0bff27ffff02ff36ffff04ff02ffff04ff29ffff04ff57ffff04ffff0bff2cff81b980ffff04ff59ff80808080808080ff81b78080ff8080ff0180ffff04ff17ffff04ff05ffff04ff8202ffffff04ffff04ffff04ff24ffff04ffff0bff7cff2fff82017f80ff808080ffff04ffff04ff30ffff04ffff0bff81bfffff0bff7cff15ffff10ff82017fffff11ff8202dfff2b80ff8202ff808080ff808080ff138080ff80808080808080808080ff018080ffff04ffff01a072dec062874cd4d3aab892a0906688a1ae412b0109982e1797a170add88bdcdcffff04ffff01a078ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1ffff04ffff01ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b08d75854cf238e55b2107e5de93e2efb99cadd4a49c4a6e2da514e0eb6b73ddd26cd7f683f8cea700d2883624a52d1f73ff018080ff0180808080",
      bundle?.coin_spends[0].puzzle_reveal
    );
    this.assert(
      "0xffff80ffff01ffff33ffa03eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc0ff82012cffffa03eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc08080ffff33ffa01cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ceff82251b8080ff8080ffffa03bc85a15c8a944691fa366adf58b476b30703de493b383ef6e05bed1b22b24bdffa02e04a52b8bb59373c6a9ea0d66f9fa67038044753119006b882623f6caa3c13aff82270f80ffa0e938d14885cf035c96dcff1ceb9e7b1a5a19910df6c9e593ada67cb1b8202ac4ffffa0979cea91ab150d99211b9e5705b088c7807aac849d494fecf0419a382fe361f7ffa0ce8a53f46946e5c5e2aa835d700745d9be3879bc5f6a029a965b7663a5c1f74cff82264780ffffa0979cea91ab150d99211b9e5705b088c7807aac849d494fecf0419a382fe361f7ffa057cddc50cc0b1e75d2324030880d970e327989b47495ed28cd7bcc7653b7e757ff82264780ff80ff8080",
      bundle?.coin_spends[0].solution
    );
  }

  async testCatTransfer2(): Promise<void> {
    const coin: OriginCoin = {
      amount: 100000000n,
      parent_coin_info: "0x5c4d6545eb708deb0b5e594403d7038f372c46f18eae853677d20f9a1ec2307d",
      puzzle_hash: "0x9a3e78995734c97d37e7d497098203117a19cefef1bbfe276bc7903f5e279e1d",
    };

    const sk_hex = "40fbb0dad159776ed05afbaeac4f4fe1b975e93bf5e9dda9fbf4e375346d12a0";
    const tgt_addr = await puzzle.getAddressFromPuzzleHash(
      "0x1cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce",
      "xch"
    );
    const change_addr = await puzzle.getAddressFromPuzzleHash(
      "0xc467280169dfc93e7a14b98475641996966d4d3800f814a2baaeab14a96e3b40",
      "xch"
    );
    const assetId = "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b";
    const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, 0, 8);

    const bundle = await catBundle.generateCatSpendBundle([coin], puzzles, tgt_addr, 300n, 0n, change_addr, null);
    this.assert(
      "0xad060a5265b32a23f96022588fcb422684bb0f44dc1aaa49415ce6ed78d931a4c3b3dc71c0c677b8f868b83f5d693a08187899f1d4579bab6b35670566579e9bd1108e7f6a353109b8a2bd563ba8458a224c80e57a104c8b165151eb959fe096",
      bundle?.aggregated_signature
    );
    this.assert(
      "0xff02ffff01ff02ffff01ff02ff5effff04ff02ffff04ffff04ff05ffff04ffff0bff2cff0580ffff04ff0bff80808080ffff04ffff02ff17ff2f80ffff04ff5fffff04ffff02ff2effff04ff02ffff04ff17ff80808080ffff04ffff0bff82027fff82057fff820b7f80ffff04ff81bfffff04ff82017fffff04ff8202ffffff04ff8205ffffff04ff820bffff80808080808080808080808080ffff04ffff01ffffffff81ca3dff46ff0233ffff3c04ff01ff0181cbffffff02ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff22ffff0bff2cff3480ffff0bff22ffff0bff22ffff0bff2cff5c80ff0980ffff0bff22ff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ff0bffff01ff02ffff03ffff09ffff02ff2effff04ff02ffff04ff13ff80808080ff820b9f80ffff01ff02ff26ffff04ff02ffff04ffff02ff13ffff04ff5fffff04ff17ffff04ff2fffff04ff81bfffff04ff82017fffff04ff1bff8080808080808080ffff04ff82017fff8080808080ffff01ff088080ff0180ffff01ff02ffff03ff17ffff01ff02ffff03ffff20ff81bf80ffff0182017fffff01ff088080ff0180ffff01ff088080ff018080ff0180ffff04ffff04ff05ff2780ffff04ffff10ff0bff5780ff778080ff02ffff03ff05ffff01ff02ffff03ffff09ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff01818f80ffff01ff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ffff04ff81b9ff82017980ff808080808080ffff01ff02ff5affff04ff02ffff04ffff02ffff03ffff09ff11ff7880ffff01ff04ff78ffff04ffff02ff36ffff04ff02ffff04ff13ffff04ff29ffff04ffff0bff2cff5b80ffff04ff2bff80808080808080ff398080ffff01ff02ffff03ffff09ff11ff2480ffff01ff04ff24ffff04ffff0bff20ff2980ff398080ffff010980ff018080ff0180ffff04ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff04ffff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ff17ff808080808080ff80808080808080ff0180ffff01ff04ff80ffff04ff80ff17808080ff0180ffffff02ffff03ff05ffff01ff04ff09ffff02ff26ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff0bff22ffff0bff2cff5880ffff0bff22ffff0bff22ffff0bff2cff5c80ff0580ffff0bff22ffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bff2cff058080ff0180ffff04ffff04ff28ffff04ff5fff808080ffff02ff7effff04ff02ffff04ffff04ffff04ff2fff0580ffff04ff5fff82017f8080ffff04ffff02ff7affff04ff02ffff04ff0bffff04ff05ffff01ff808080808080ffff04ff17ffff04ff81bfffff04ff82017fffff04ffff0bff8204ffffff02ff36ffff04ff02ffff04ff09ffff04ff820affffff04ffff0bff2cff2d80ffff04ff15ff80808080808080ff8216ff80ffff04ff8205ffffff04ff820bffff808080808080808080808080ff02ff2affff04ff02ffff04ff5fffff04ff3bffff04ffff02ffff03ff17ffff01ff09ff2dffff0bff27ffff02ff36ffff04ff02ffff04ff29ffff04ff57ffff04ffff0bff2cff81b980ffff04ff59ff80808080808080ff81b78080ff8080ff0180ffff04ff17ffff04ff05ffff04ff8202ffffff04ffff04ffff04ff24ffff04ffff0bff7cff2fff82017f80ff808080ffff04ffff04ff30ffff04ffff0bff81bfffff0bff7cff15ffff10ff82017fffff11ff8202dfff2b80ff8202ff808080ff808080ff138080ff80808080808080808080ff018080ffff04ffff01a072dec062874cd4d3aab892a0906688a1ae412b0109982e1797a170add88bdcdcffff04ffff01a06e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6bffff04ffff01ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0b5c7539888af59f601be0ea2eddd32c06a80d932170eec55ef7a7640cbc5b37b81c4258644229eca2322298a9bf0189fff018080ff0180808080",
      bundle?.coin_spends[0].puzzle_reveal
    );
    this.assert(
      "0xffff80ffff01ffff33ffa01cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ceff82012cffffa01cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce8080ffff33ffa0c467280169dfc93e7a14b98475641996966d4d3800f814a2baaeab14a96e3b40ff8405f5dfd48080ff8080ffffa021c2167357ccce57f6e592b3c83c2c5e290ab11904fa3646747b7b298497c7f1ffa0b1fe69c9d077b339dfa965bddae6a7d926317f2955d2674edc9b6e10a72a2df1ff8405f5e10080ffa0cbcd120ddaf7fa60b1b316ea59860068ab1c0bbd384fc20b8844f8ec5b1edd17ffffa05c4d6545eb708deb0b5e594403d7038f372c46f18eae853677d20f9a1ec2307dffa09a3e78995734c97d37e7d497098203117a19cefef1bbfe276bc7903f5e279e1dff8405f5e10080ffffa05c4d6545eb708deb0b5e594403d7038f372c46f18eae853677d20f9a1ec2307dffa03eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc0ff8405f5e10080ff80ff8080",
      bundle?.coin_spends[0].solution
    );
  }
}
</script>

<style scoped lang="scss">
#self-test {
  display: table-row;
}
</style>
