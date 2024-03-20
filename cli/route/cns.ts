import express from "express";
import { CnsMetadataValues, NftCoinAnalysisResult } from "../../lib-chia/models/nft";
import { NetworkContext } from "../../lib-chia/services/coin/coinUtility";
import { Hex0x, prefix0x } from "../../lib-chia/services/coin/condition";
import { analyzeNftCoin } from "../../lib-chia/services/coin/nft";
import puzzle from "../../lib-chia/services/crypto/puzzle";
import { TokenPuzzleDetail } from "../../lib-chia/services/crypto/receive";
import utility from "../../lib-chia/services/crypto/utility";
import { generateMintCnsOffer } from "../../lib-chia/services/offer/cns";
import { encodeOffer } from "../../lib-chia/services/offer/encoding";
import { OriginCoin, signSpendBundle } from "../../lib-chia/services/spendbundle";
import { getLineageProofPuzzle } from "../../lib-chia/services/transfer/call";
import { SymbolCoins } from "../../lib-chia/services/transfer/transfer";
import { Instance } from "../../lib-chia/services/util/instance";

interface CnsOfferRequest {
  targetAddress: string;
  changeAddress: string;
  price: number;
  fee: number;
  metadata: CnsMetadataValues;
  coin: OriginCoin;
  privateKey: string;
  puzzleHash: string;
  puzzleText: string;
  royaltyAddress: string;
  royaltyPercentage: number;
  chainId?: string;
  symbol?: string;
  prefix?: string;
  nonce?: string; //test only
  intermediateKey?: string;
  rpcUrl?: string;
  legacyNft?: {
    coin: OriginCoin;
    puzzle_reveal: Hex0x;
    solution: Hex0x;
  };
}

export function getCreateCnsOfferFunc(option: {
  defaultRpcUrl: string;
}): (req: express.Request, res: express.Response) => Promise<void> {
  const { defaultRpcUrl } = option;
  return async function (req: express.Request, res: express.Response): Promise<void> {
    let r: CnsOfferRequest | null = null;
    try {
      r = req.body as CnsOfferRequest;
      const offer = await generateCnsSpendBundle(req, res, { defaultRpcUrl });
      if (!offer) return;

      res.send(JSON.stringify({ offer }));
    } catch (err) {
      console.warn(err);
      if (r) console.log(`${JSON.stringify(r)},`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }));
    }
  };
}

async function generateCnsSpendBundle(
  req: express.Request,
  res: express.Response,
  options: { defaultRpcUrl: string }
): Promise<string | undefined> {
  const { defaultRpcUrl } = options;
  const r = req.body as CnsOfferRequest;
  if (!r.metadata) {
    res.status(400).send(JSON.stringify({ success: false, error: "metadata cannot be empty" }));
    return;
  }
  if (!r.metadata.bindings) r.metadata.bindings = {};

  // console.log(`${JSON.stringify(r)},`);

  r.chainId = r.chainId || "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
  r.prefix = r.prefix || "xch";
  r.symbol = r.symbol || "XCH";
  const rpcUrl = r.rpcUrl || defaultRpcUrl;
  if (r.metadata.bindings.address?.startsWith(r.prefix + "1"))
    r.metadata.bindings.address = puzzle.getPuzzleHashFromAddress(r.metadata.bindings.address);

  let legacyNft: NftCoinAnalysisResult | undefined;
  if (r.legacyNft && r.legacyNft.coin && r.legacyNft.puzzle_reveal && r.legacyNft.solution) {
    if (!r.legacyNft.puzzle_reveal.startsWith("0x")) r.legacyNft.puzzle_reveal = prefix0x(r.legacyNft.puzzle_reveal);
    if (!r.legacyNft.solution.startsWith("0x")) r.legacyNft.solution = prefix0x(r.legacyNft.solution);
    const tnft = await analyzeNftCoin(r.legacyNft.puzzle_reveal, "", r.legacyNft.coin, r.legacyNft.solution);
    legacyNft = tnft ? tnft : undefined;
  }

  const availcoinsForMaker: SymbolCoins = {
    [r.symbol]: [
      {
        amount: 1n,
        parent_coin_info: r.coin.parent_coin_info,
        puzzle_hash: r.coin.puzzle_hash,
      },
    ],
  };
  const sk = Instance.BLS?.PrivateKey.from_bytes(utility.fromHexString(r.privateKey), false);
  if (!sk) {
    res.status(400).send(JSON.stringify({ success: false, error: "private key cannot be parsed" }));
    return;
  }

  const pubkey = utility.toHexString(sk.get_g1().serialize());
  const synPubKey = prefix0x(await puzzle.getSyntheticKey(pubkey));
  const tokenPuzzles: TokenPuzzleDetail[] = [
    {
      symbol: r.symbol,
      puzzles: [
        {
          privateKey: sk,
          synPubKey,
          puzzle: r.puzzleText,
          hash: r.puzzleHash,
          address: "",
        },
      ],
    },
  ];
  const royaltyAddressHex = puzzle.getPuzzleHashFromAddress(r.royaltyAddress);
  const net: NetworkContext = {
    chainId: r.chainId,
    prefix: r.prefix,
    symbol: r.symbol,
    api: (_) => getLineageProofPuzzle(_, rpcUrl),
  };
  const uofferBundle = await generateMintCnsOffer(
    r.targetAddress,
    r.changeAddress,
    BigInt(r.price),
    BigInt(r.fee),
    r.metadata,
    availcoinsForMaker,
    tokenPuzzles,
    royaltyAddressHex,
    r.royaltyPercentage,
    net,
    r.nonce,
    r.intermediateKey,
    legacyNft
  );
  const offerBundle = await signSpendBundle(uofferBundle, tokenPuzzles, net.chainId);
  const offer = await encodeOffer(offerBundle, 6);

  return offer;
}
