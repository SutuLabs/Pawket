import { OriginCoin } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import { generateMintCatBundle } from "@/services/mint/cat";
import { Instance } from "@/services/util/instance";

function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }
function chainId() { return "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"; }

beforeAll(async () => {
  await Instance.init();
})

test('Mint Cat', async () => {
  const coin: OriginCoin = {
    "amount": 25n,
    "parent_coin_info": "0xc1f1407bec5f2c33207bf2d61321114fa7558268ddf1f0a3326fcbb6bca496be",
    "puzzle_hash": "0xd9c531638dfcd539e4f040af35157d19045c4f9f23ad3fea207b92b672925a35"
  };

  const sk_hex = "297aedaf1e5c001377aea56142b4f56b8c9f5bdc7b046b47c8609b9cbdde067e";
  const tgt_addr = "xch1qqltywgepnjekjh3u3sjjxu3sh82vttqwt7nwxq9rffslk9gyx9uqg8lqru";
  const change_addr = "xch1m8znzcudln2nne8sgzhn29taryz9cnulywknl63q0wftvu5jtg6sjp4yvm";

  const memo = "hello";
  const fee = 1n;
  const amount = 10n;
  const requests = await puzzle.getPuzzleDetails(utility.fromHexString(sk_hex), "xch", 0, 1);

  const { spendBundle, assetId } = await generateMintCatBundle(
    tgt_addr,
    change_addr,
    amount,
    fee,
    memo,
    { [xchSymbol()]: [coin] },
    sk_hex,
    [{ puzzles: requests, symbol: xchSymbol() }],
    xchSymbol(),
    chainId(),
    "cat_v1",
  );

  expect(spendBundle).toMatchSnapshot("spendbundle");
  expect(assetId).toMatchSnapshot("assetid");
});