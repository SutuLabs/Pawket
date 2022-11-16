import { OriginCoin, signSpendBundle } from "../spendbundle";
import { NetworkContextWithOptionalApi } from "../coin/coinUtility";
import { prefix0x } from "../coin/condition";
import puzzle from "../crypto/puzzle";
import utility from "../crypto/utility";
import transfer from "../transfer/transfer";
import { assert } from "./runner";

function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }
const net: NetworkContextWithOptionalApi = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
}

export async function testStandardTransfer(): Promise<void> {
  const coin: OriginCoin = {
    amount: BigInt(1750000000000),
    parent_coin_info: "0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001",
    puzzle_hash: "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3",
  };
  const sk_hex = "5c3b9b1062eaefd843d79d2b53856da31521ed7d1fe2a3ec48c71e654c4530e5";
  const tgt_addr = await puzzle.getAddressFromPuzzleHash(
    "0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5",
    xchPrefix()
  );
  const change_addr = await puzzle.getAddressFromPuzzleHash(
    "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3",
    xchPrefix()
  );
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(tgt_addr));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(change_addr));
  const puzzles = await puzzle.getPuzzleDetails(utility.fromHexString(sk_hex), "xch", 0, 5);
  const plan = await transfer.generateSpendPlan({ [xchSymbol()]: [coin] }, [{ symbol: xchSymbol(), address: tgt_hex, amount: 1_000_000n, }], change_hex, 0n, xchSymbol());
  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, [{ symbol: xchSymbol(), puzzles }], [], net);
  const bundle = await signSpendBundle(ubundle, [{ symbol: xchSymbol(), puzzles }], net.chainId)
  assert(
    "0x81198e68402824e0585fac43d79edf3efe19e4651747f4e9b8d28f6a8a5c319dac67d4a0c03ad957cbb7d7c3c955605d03d6c5750e0aa44baf73ddaa5fcfbe74e3cb922034b72656f0df410ff6ef8e81b56b1a6a0c9bddd9331b7a9c90f897ce",
    bundle?.aggregated_signature
  );
  assert(
    "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0a042c855d234578415254b7870b711fb25e8f85beaa4a66bd0673d394c761fa156406c2e3bb375d5b18766d2a12cc918ff018080",
    bundle?.coin_spends[0].puzzle_reveal
  );
  assert(
    "0xff80ffff01ffff33ffa087908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5ff830f424080ffff33ffa04f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3ff860197741199c08080ff8080",
    bundle?.coin_spends[0].solution
  );
}