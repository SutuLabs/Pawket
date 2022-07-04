import { SpendBundle } from "@/models/wallet";
import store from "@/store";
import { xchPrefix } from "@/store/modules/network";
import { testMintCat } from "./catMintTest";
import { testCatTransfer, testCatTransfer2 } from "./catTransferTest";
import { testCoinName, testCryptography, testPuzzleAssemble } from "./cryptoTest";
import { testNftMint, testNftTransfer } from "./nftTest";
import { testMakeOffer2, testMakeOffer1, testOfferEncoding, testTakeOfferXchForCat, testTakeOfferCatForXch } from "./offerTest";
import { testStandardTransfer } from "./stdTransferTest";

class TestRunner {

  async selfTest(): Promise<void> {
    try {
      const timestamp = this.getExpireTime();
      if (Date.now() < timestamp) {
        store.state.app.selfTestStatus = "Passed";
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("self-test started");
      }

      await this.runTest(testCryptography);
      await this.runTest(testPuzzleAssemble);
      await this.runTest(testCoinName);

      // make extra tests not in production
      if (process.env.NODE_ENV !== "production") {
        if (xchPrefix() == "xch") {
          // test only on mainnet
          await this.runTest(testStandardTransfer);
          await this.runTest(testCatTransfer);
          await this.runTest(testCatTransfer2);
          await this.runTest(testOfferEncoding);
          await this.runTest(testMakeOffer1);
          await this.runTest(testMakeOffer2);
          await this.runTest(testTakeOfferXchForCat);
          await this.runTest(testTakeOfferCatForXch);
          await this.runTest(testMintCat);
        } else {
          await this.runTest(testNftMint);
          await this.runTest(testNftTransfer);

          console.log("self-test partially ignored");
        }

        console.log("self-test passed");
      }

      store.state.app.selfTestStatus = "Passed";
      store.state.app.selfTestError = store.state.app.selfTestStatus;
    } catch (error) {
      store.state.app.selfTestStatus = "Failed";
      store.state.app.selfTestError = String(error);
    }
  }

  async runTest(test: () => Promise<void>): Promise<void> {
    try {
      await test();
    } catch (error) {
      console.warn(test.name, error);
      throw error;
    }
  }

  readonly DISABLE_SELFTEST_KEY = "DISABLE_SELFTEST";
  public getExpireTime(): number {
    const timestamp = (localStorage.getItem(this.DISABLE_SELFTEST_KEY) || 0) as number;
    return timestamp;
  }

  public setExpireTime(seconds = 30 * 60): void {
    localStorage.setItem(this.DISABLE_SELFTEST_KEY, (Date.now() + seconds * 1000).toString());
  }
}

export default new TestRunner();

export function assert<T>(expect: T, actual: T, desc: string | undefined = undefined): void {
  const descHint = desc ? " " + desc : "";
  if (expect != actual) {
    throw `asserting${descHint} failed\nexpect:${expect}\nactual:${actual}`;
  }
}

export function assertBundle(expect: SpendBundle, actual: SpendBundle): void {
  try {
    assert(expect.aggregated_signature, actual.aggregated_signature);
    assert(expect.coin_spends.length, actual.coin_spends.length);
    for (let i = 0; i < expect.coin_spends.length; i++) {
      assert(expect.coin_spends[i].puzzle_reveal, actual.coin_spends[i].puzzle_reveal);
      assert(expect.coin_spends[i].solution, actual.coin_spends[i].solution);
      assert(expect.coin_spends[i].coin.amount, actual.coin_spends[i].coin.amount);
      assert(expect.coin_spends[i].coin.parent_coin_info, actual.coin_spends[i].coin.parent_coin_info);
      assert(expect.coin_spends[i].coin.puzzle_hash, actual.coin_spends[i].coin.puzzle_hash);
    }
  }
  catch (err) {
    console.warn("expect bundle:", expect);
    console.warn("actual bundle:", actual);
    throw err;
  }
}