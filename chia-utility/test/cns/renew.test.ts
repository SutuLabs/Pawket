import { getTestAccount, prepareBigIntStringify } from "../utility";
import { SymbolCoins } from "../../services/transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle } from "../../services/coin/nft";
import puzzle from "../../services/crypto/puzzle";
import { GetParentPuzzleResponse } from "../../models/api";
import { getAccountAddressDetails } from "../../services/util/account";

import { CnsMetadataValues } from "../../models/nft";
import { cnsMetadata, knownCoins } from "./cns.test.data";
import { signSpendBundle } from "../../services/spendbundle";
import { combineOfferSpendBundle, generateNftOffer, generateOfferPlan, getReversePlan } from "../../services/offer/bundler";
import { decodeOffer, encodeOffer } from "../../services/offer/encoding";
import { convertOfferToRequest, getOfferSummary, OfferEntityForNft } from "../../services/offer/summary";
import { generateMintCnsOffer } from "../../services/offer/cns";
import { getCoinName0x, NetworkContext } from "../../services/coin/coinUtility";
import { Hex, prefix0x } from "../../services/coin/condition";

import { assertSpendbundle } from "../../services/spendbundle/validator";
import { expiryDate } from "./functions";

const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
};
function xchPrefix() {
  return "xch";
}
function xchSymbol() {
  return "XCH";
}

test("Renew CNS Offer And Accept: standard", async () => {
  const md = Object.assign({}, cnsMetadata);
  if (!md.bindings) assert.fail("undefined bindings");
  md.name = "hiya.xch";
  md.bindings.address = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  md.expiry = expiryDate();
  await testMintCnsAndOffer(0n, md, md.bindings.address);
});

test("Renew CNS Offer And Accept 2: empty address binding", async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglon.xch";
  expect(md.name.length).toBe(63 + ".xch".length);
  md.expiry = expiryDate();
  await testMintCnsAndOffer(0n, md, "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e");
});

async function testMintCnsAndOffer(fee: bigint, metadata: CnsMetadataValues, tgt_hex: Hex): Promise<void> {
  const target_hex = prefix0x(tgt_hex);
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix());
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, xchPrefix());

  const nonce = "626f9cf141deefc2e77a56a4ef99996259e840dc4020eda31408cdd442a770d1";
  const intermediate_sk = "44475cb971933e4545efad1337f3d68bc53523d987412df233f3b905ed1c5b3f";
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const p2PuzzleHash = prefix0x(tokenPuzzles.at(0)?.puzzles.at(0)?.hash);
  const p2PuzzleAddress = tokenPuzzles.at(0)?.puzzles.at(0)?.address;

  const availcoinsForTakerLegacyNft: SymbolCoins = {
    [xchSymbol()]: [
      {
        amount: 4n,
        parent_coin_info: "0x3fb7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        puzzle_hash: p2PuzzleHash,
      },
    ],
  };
  const ometadata = Object.assign({}, metadata);
  ometadata.expiry = "1000000000";
  const legacyNftBundle = await generateMintNftBundle(
    p2PuzzleAddress,
    changeAddress,
    fee,
    ometadata,
    availcoinsForTakerLegacyNft,
    tokenPuzzles,
    undefined,
    500,
    net,
    undefined,
    undefined,
    undefined,
    true
  );
  const legacyNftcs = legacyNftBundle.coin_spends[2];

  {
    const cs = legacyNftBundle.coin_spends;
    knownCoins.push(
      ...[
        {
          parentCoinId: cs[2].coin.parent_coin_info,
          parentParentCoinId: getCoinName0x(cs[1].coin),
          amount: Number(cs[2].coin.amount),
          puzzleReveal: cs[2].puzzle_reveal,
        },
      ]
    );
  }

  const legacyNft = await analyzeNftCoin(legacyNftcs.puzzle_reveal, "", legacyNftcs.coin, legacyNftcs.solution);
  const availcoinsForMaker: SymbolCoins = {
    [xchSymbol()]: [
      {
        amount: 1n,
        parent_coin_info: "0xc4badc175d119df8006fd8e96ad84c475e743275e70d6c16f43cf83fb75df021",
        puzzle_hash: "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10",
      },
    ],
  };
  const availcoinsForTaker: SymbolCoins = {
    [xchSymbol()]: [
      {
        amount: 4998999984n,
        parent_coin_info: "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        puzzle_hash: "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155",
      },
    ],
  };

  const royaltyAddressHex = "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";
  const tradePricePercentage = 500;

  const price = 200n;
  const uofferBundle = await generateMintCnsOffer(
    targetAddress,
    changeAddress,
    price,
    0n,
    metadata,
    availcoinsForMaker,
    tokenPuzzles,
    royaltyAddressHex,
    tradePricePercentage,
    net,
    nonce,
    intermediate_sk,
    legacyNft
  );

  // combine into one spendbundle
  const offerBundle = await signSpendBundle(uofferBundle, tokenPuzzles, net.chainId);

  const offerText = await encodeOffer(offerBundle, 6);
  expect(offerText).toMatchSnapshot("offer text");

  // for offer taker

  const makerBundle = await decodeOffer(offerText);
  expect(makerBundle).toStrictEqual(offerBundle);

  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const revSummary = getReversePlan(summary, change_hex, {});
  expect(revSummary).toMatchSnapshot("revSummary");
  expect(fee).toMatchSnapshot("fee");
  const analysis = summary.offered[0].type == "nft" && summary.offered[0].nftanalysis;
  if (!analysis) assert.fail("failed to get analysis from summary");
  expect(analysis).toMatchSnapshot("cns analysis");
  const takerRevSumOffered = [...revSummary.offered];
  const takerNftOffer: OfferEntityForNft = takerRevSumOffered.find((_) => _.type == "nft") as OfferEntityForNft;
  takerNftOffer.nftanalysis = legacyNft;
  takerNftOffer.coin.coin = legacyNft.coin;

  prepareBigIntStringify();
  // change NFT to the taker's holding NFT instead of the maker's settlement-payment NFT
  const offplangen = await generateOfferPlan(
    takerRevSumOffered,
    change_hex,
    availcoinsForTaker,
    fee,
    xchSymbol(),
    price,
    analysis
  );
  expect(offplangen).toMatchSnapshot("offplangen");
  const reqs = convertOfferToRequest(revSummary.requested);
  const utakerBundle = await generateNftOffer(offplangen, reqs, tokenPuzzles, net, nonce);
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, net.chainId);
  const uofferText = await encodeOffer(takerBundle, 6);
  expect(uofferText).toMatchSnapshot("takerBundle offer text");
  expect(takerBundle).toMatchSnapshot("takerBundle");
  const bundle = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("combined");
}

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find((_) => _.parentCoinId == parentCoinId);
  return resp;
}
