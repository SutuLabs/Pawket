import { CnsMetadataValues } from "@/models/nft";
import { NetworkContext } from "@/services/coin/coinUtility";
import { generateMintNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { SpendBundle, signSpendBundle } from "@/services/spendbundle";
import { SymbolCoins } from "@/services/transfer/transfer";
import { getAccountAddressDetails } from "@/services/util/account";
import { getTestAccount } from "../utility";

export async function mintOneCns(
  fee: bigint,
  metadata: CnsMetadataValues,
  net: NetworkContext,
  targetAddresses: string[] | undefined = undefined,
): Promise<SpendBundle> {
  const target_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, net.prefix);
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, net.prefix);

  const royaltyAddressHex = "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";
  const tradePricePercentage = 500;

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v2");
  const availcoins: SymbolCoins = {
    [net.symbol]: [
      {
        "amount": 4998999984n,
        "parent_coin_info": "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ]
  };
  const sk = "00186eae4cd4a3ec609ca1a8c1cda8467e3cb7cbbbf91a523d12d31129d5f8d7";
  const ubundle = await generateMintNftBundle(
    targetAddress, changeAddress, fee, metadata, availcoins, tokenPuzzles, royaltyAddressHex,
    tradePricePercentage, net, undefined, sk, targetAddresses, true);
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  return bundle;
}

export function expiryDate(): string {
  const dt = new Date(2022, 9, 31, 16, 0, 0); // month have 1 offset, this 2022-10-31
  return Math.floor(dt.getTime() / 1000 - dt.getTimezoneOffset() * 60).toFixed(0);
}