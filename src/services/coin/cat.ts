import { prefix0x } from "@/services/coin/condition";
import store from "@/store";
import { AccountEntity, CustomCat, TokenInfo } from "@/store/modules/account";

function getCatsOfCurrentNetwork(account?: AccountEntity): CustomCat[] {
  if (!account || !account.cats) {
    return [];
  }
  const cats: CustomCat[] = [];
  for (const c of account.cats) {
    const network = c.network ?? "mainnet";
    if (network !== store.state.network.networkId) continue;
    cats.push(c);
  }
  return cats;
}

export function getCatNameDict(account?: AccountEntity): { [id: string]: string } {
  const cats = getCatsOfCurrentNetwork(account);
  return Object.assign(
    {},
    ...Object.values(store.state.account.tokenInfo).map((_) => ({ [prefix0x(_.id ?? "")]: _.symbol })),
    ...(cats?.map((_) => ({ [prefix0x(_.id)]: _.name })) ?? [])
  );
}

export function getCatIdDict(account?: AccountEntity): { [name: string]: string } {
  const cats = getCatsOfCurrentNetwork(account);
  return Object.assign(
    {},
    ...Object.values(store.state.account.tokenInfo).map((_) => ({ [_.symbol]: prefix0x(_.id ?? "") })),
    ...(cats?.map((_) => ({ [_.name]: prefix0x(_.id) })) ?? [])
  );
}

export function getTokenInfo(account?: AccountEntity): TokenInfo {
  const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
  if (account?.cats) {
    for (let i = 0; i < account.cats.length; i++) {
      const cat = account.cats[i];
      const network = cat.network ?? "mainnet";
      if (network !== store.state.network.networkId) continue;
      tokenInfo[cat.name] = {
        id: cat.id,
        symbol: cat.name,
        decimal: 3,
        unit: cat.name,
      };
    }
  }

  return tokenInfo;
}
