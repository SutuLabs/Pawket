import { AccountEntity, TokenInfo } from "../../../../pawket-chia-lib/models/account";
import { prefix0x } from "../../../../pawket-chia-lib/services/coin/condition";
import store from "@/store";
import { getAccountCats } from "@/store/modules/account";

export interface ExtraAssetEntity { assetId: string; name: string }

export function getCatNames(account?: AccountEntity, extra: ExtraAssetEntity[] = []): string[] {
  if (!account) {
    return [];
  }
  return Object.keys(store.state.account.tokenInfo).concat(
    getAccountCats(account).map((_) => _.name)
  ).concat(
    extra.map(_ => _.name)
  );
}
export function getCatNameDict(account?: AccountEntity, extra: ExtraAssetEntity[] = []): { [id: string]: string } {
  const cats = account ? getAccountCats(account) : [];
  return Object.assign(
    {},
    ...Object.values(store.state.account.tokenInfo).map((_) => ({ [prefix0x(_.id ?? "")]: _.symbol })),
    ...(cats.map((_) => ({ [prefix0x(_.id)]: _.name }))),
    ...(extra.map((_) => ({ [prefix0x(_.assetId)]: _.name })))
  );
}

export function getCatIdDict(account?: AccountEntity, extra: ExtraAssetEntity[] = []): { [name: string]: string } {
  const cats = account ? getAccountCats(account) : [];
  return Object.assign(
    {},
    ...Object.values(store.state.account.tokenInfo).map((_) => ({ [_.symbol]: prefix0x(_.id ?? "") })),
    ...(cats.map((_) => ({ [_.name]: prefix0x(_.id) }))),
    ...(extra.map((_) => ({ [_.name]: prefix0x(_.assetId) })))
  );
}

export function getTokenInfo(account?: AccountEntity): TokenInfo {
  if (!account) return {};
  const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
  const cats = getAccountCats(account);
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    tokenInfo[cat.name] = {
      id: cat.id,
      symbol: cat.name,
      decimal: 3,
      unit: cat.name,
    };
  }

  return tokenInfo;
}

export interface CatCoinAnalysisResult {
  modHash: string;
  tailProgramHash: string;
  innerPuzzle: string;
  hintPuzzle: string;
}