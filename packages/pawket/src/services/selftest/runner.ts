import store from "@/store";
import { testCoinName, testCryptography, testPuzzleAssemble } from "../../../../pawket-chia-lib/services/selftest/cryptoTest";
import { testStandardTransfer } from "../../../../pawket-chia-lib/services/selftest/stdTransferTest";

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
      await this.runTest(testStandardTransfer);

      if (process.env.NODE_ENV !== "production") {
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
