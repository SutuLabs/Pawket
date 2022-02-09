<template>
  <div class="box">{{ errorMessage }}</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { OriginCoin } from '../models/wallet';
import utility from '@/services/crypto/utility';
import puzzle from '@/services/crypto/puzzle';
import transfer from '@/services/crypto/transfer';
import store from '@/store';

@Component
export default class SelfTest extends Vue {
  public errorMessage = "Checking";

  mounted(): void {
    this.selfTest().then(() => {
      console.log();
    });
  }

  assert<T>(expect: T, actual: T): void {
    if (expect != actual) {
      console.log("asserting failed", expect, actual);
      throw `expect [${expect}] != actual [${actual}]`;
    }
  }

  async selfTest(): Promise<void> {
    try {
      await store.dispatch("initializeBls");
      var privkey = utility.fromHexString(
        "67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2"
      );
      const sk = await utility.getPrivateKey(privkey);
      const masterprikey = utility.toHexString(sk.serialize());
      const masterpubkey = utility.toHexString(sk.get_g1().serialize());
      this.assert(
        "67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2",
        masterprikey
      );
      this.assert(
        "89d4ca795881dc192cf7e0bcf22528c3d7708f57aa644647ae2506cd10405dc528b36e450ab901675f7a6289a4335a22",
        masterpubkey
      );
      this.assert("2308828858", sk.get_g1().get_fingerprint().toString());

      const derive = await utility.derive(privkey);
      const farmerpubkey = utility.toHexString(derive([12381, 8444, 0, 0]).get_g1().serialize());
      this.assert(
        "99f181b1b30865339eea4e61172e64282ed1793022363f6635affbfb2aa2f4384ef10df47a445f92d685c7265488777e",
        farmerpubkey
      );
      const poolpubkey = utility.toHexString(derive([12381, 8444, 1, 0]).get_g1().serialize());
      this.assert(
        "9896eb01246db07360b4caba1861a6d13c5be923e28a68ba8429d841c5dfa429e05ef639003793c4715a8be4578abe9e",
        poolpubkey
      );
      const walletprikey = utility.toHexString(derive([12381, 8444, 2, 0]).serialize());
      this.assert(
        "0408d4c5e7c97af49dd5605db1907a231761c0cba816c778e74c8de24d0793cd",
        walletprikey
      );
      const walletpubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
      this.assert(
        "8b58921998b2337fd9d4a410e8bd11dfda435feb92dc3d6f3e111194b99a0391f39cf9b9534a44d154c9d7492400f36b",
        walletpubkey
      );
      // });
      const adr = await puzzle.getAddress(walletpubkey, "xch");
      this.assert(
        "xch13akv0y3er0qvdjwzks2gm4ljj7qpynrh6rcsnwc6y0hyfgzdj89sr43zcp",
        adr
      );

      const coin: OriginCoin = {
        amount: BigInt(1750000000000),
        parent_coin_info: '0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001',
        puzzle_hash: '0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3'
      };
      const sk_hex = "5c3b9b1062eaefd843d79d2b53856da31521ed7d1fe2a3ec48c71e654c4530e5";
      const tgt_addr = await puzzle.getAddressFromPuzzleHash("0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5", "xch");
      const change_addr = await puzzle.getAddressFromPuzzleHash("0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3", "xch");
      const bundle = await transfer.generateSpendBundle([coin], sk_hex, tgt_addr, 1_000_000n, 0n, change_addr);
      this.assert(
        "0x81198e68402824e0585fac43d79edf3efe19e4651747f4e9b8d28f6a8a5c319dac67d4a0c03ad957cbb7d7c3c955605d03d6c5750e0aa44baf73ddaa5fcfbe74e3cb922034b72656f0df410ff6ef8e81b56b1a6a0c9bddd9331b7a9c90f897ce",
        bundle?.aggregated_signature);
      this.assert(
        "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0a042c855d234578415254b7870b711fb25e8f85beaa4a66bd0673d394c761fa156406c2e3bb375d5b18766d2a12cc918ff018080",
        bundle?.coin_spends[0].puzzle_reveal);
      this.assert(
        "0xff80ffff01ffff33ffa087908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5ff830f424080ffff33ffa04f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3ff860197741199c08080ff8080",
        bundle?.coin_spends[0].solution);

      const coinname = transfer.getCoinName({
        "amount": 1000000000n,
        "parent_coin_info": "0xcd299604b459e5ff20da17627d684ea143fc1b5b4165166943729d2d24305de8",
        "puzzle_hash": "0x484aaab0cda1b0149df9adeddb0a5d28976ad259ff6173f4488cbc68f095eb79"
      });
      this.assert("c62152493a6f3fbca7a918a8258e52f84c4e8aa286b8ebf1b0d5e5dda7fa7e6f", coinname.hex());

      this.errorMessage = "Passed";
    } catch (error) {
      this.errorMessage = error;
      console.warn(error);
    }
  }
}
</script>

<style scoped lang="scss"></style>
