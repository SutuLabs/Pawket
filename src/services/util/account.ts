import { AccountEntity, CustomCat, TokenInfo } from "@/models/account";
import receive, { TokenPuzzleDetail } from "../crypto/receive";

export const DEFAULT_ADDRESS_RETRIEVAL_COUNT = 4;

export async function getAccountAddressDetails(
  account: AccountEntity,
  cats: CustomCat[],
  tokenInfo: TokenInfo,
  prefix: string,
  symbol: string,
  maxId: number | undefined = undefined,
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
): Promise<TokenPuzzleDetail[]> {
  if (typeof maxId !== "number" || maxId <= 0) maxId = account.addressRetrievalCount;
  if (typeof maxId !== "number" || maxId <= 0) DEFAULT_ADDRESS_RETRIEVAL_COUNT;
  if(!account.key.privateKey) throw new Error("Private key cannot empty to get account addresses. (Are you working with address account which don't have private key?)");

  if (account.addressGenerated == maxId) {
    return account.addressPuzzles;
  }

  account.addressPuzzles = await receive.getAssetsRequestDetail(account.key.privateKey, 0, maxId, cats, tokenInfo, prefix, symbol, catModName);
  account.addressGenerated = maxId;
  return account.addressPuzzles;
}
