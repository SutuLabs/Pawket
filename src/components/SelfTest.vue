<template>
  <div class="box">{{ errorMessage }}</div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import utility from "../store/utility";

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
      var privkey = utility.fromHexString(
        "67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2"
      );
      utility.getBLS(privkey).then(({ sk }) => {
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
      });

      const derive = await utility.derive(privkey);
      const farmerpubkey = utility.toHexString(
        derive([12381, 8444, 0, 0]).get_g1().serialize()
      );
      this.assert(
        "99f181b1b30865339eea4e61172e64282ed1793022363f6635affbfb2aa2f4384ef10df47a445f92d685c7265488777e",
        farmerpubkey
      );
      const poolpubkey = utility.toHexString(
        derive([12381, 8444, 1, 0]).get_g1().serialize()
      );
      this.assert(
        "9896eb01246db07360b4caba1861a6d13c5be923e28a68ba8429d841c5dfa429e05ef639003793c4715a8be4578abe9e",
        poolpubkey
      );
      const walletprikey = utility.toHexString(
        derive([12381, 8444, 2, 0]).serialize()
      );
      this.assert(
        "0408d4c5e7c97af49dd5605db1907a231761c0cba816c778e74c8de24d0793cd",
        walletprikey
      );
      const walletpubkey = utility.toHexString(
        derive([12381, 8444, 2, 0]).get_g1().serialize()
      );
      this.assert(
        "8b58921998b2337fd9d4a410e8bd11dfda435feb92dc3d6f3e111194b99a0391f39cf9b9534a44d154c9d7492400f36b",
        walletpubkey
      );
      // });
      const adr = await utility.getAddress(walletpubkey, "xch");
      this.assert(
        "xch13akv0y3er0qvdjwzks2gm4ljj7qpynrh6rcsnwc6y0hyfgzdj89sr43zcp",
        adr
      );
      this.errorMessage = "Passed";
    } catch (error) {
      this.errorMessage = error;
    }
  }
}
</script>

<style scoped lang="scss"></style>
