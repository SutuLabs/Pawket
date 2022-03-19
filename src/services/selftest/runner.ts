import { SpendBundle } from "@/models/wallet";
import store from "@/store";
import { testCatTransfer, testCatTransfer2 } from "./catTransferTest";
import { testCoinName, testCryptography, testPuzzleAssemble } from "./cryptoTest";
import { testMakeOffer2, testMakeOffer1, testOfferEncoding } from "./offerTest";
import { testStandardTransfer } from "./stdTransferTest";

class TestRunner {

  async selfTest(): Promise<void> {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("self-test started");
      }

      await testCryptography();
      await testPuzzleAssemble();
      await testCoinName();

      // make extra tests not in production
      if (process.env.NODE_ENV !== "production") {
        await testStandardTransfer();
        await testCatTransfer();
        await testCatTransfer2();
        await testOfferEncoding();
        await testMakeOffer1();
        await testMakeOffer2();

        console.log("self-test passed");
      }

      store.state.app.selfTestStatus = "Passed";
      store.state.app.selfTestError = store.state.app.selfTestStatus;
    } catch (error) {
      store.state.app.selfTestStatus = "Failed";
      store.state.app.selfTestError = error;
      console.warn(error);
    }
  }
}

export default new TestRunner();

export function assert<T>(expect: T, actual: T): void {
  if (expect != actual) {
    throw `asserting failed\nexpect:${expect}\nactual:${actual}`;
  }
}

export function assertBundle(expect: SpendBundle, actual: SpendBundle): void {
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