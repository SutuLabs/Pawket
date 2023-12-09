import { SpendBundle } from "../spendbundle";

class TestUtility {
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

export default new TestUtility();

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
  } catch (err) {
    console.warn("expect bundle:", expect);
    console.warn("actual bundle:", actual);
    throw err;
  }
}
