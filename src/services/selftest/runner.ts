import store from "@/store";
import { testCatTransfer, testCatTransfer2 } from "./catTransferTest";
import { testCoinName, testCryptography, testPuzzleAssemble } from "./cryptoTest";
import { testOffer } from "./offerTest";
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
        await testOffer();

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