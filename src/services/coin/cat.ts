import { prefix0x } from '@/services/coin/condition';
import store from "@/store";
import { AccountEntity, TokenInfo } from "@/store/modules/account";

export function getCatNameDict(account: AccountEntity): { [id: string]: string } {
  return Object.assign(
    {},
    ...Object.values(store.state.account.tokenInfo).map((_) => ({ [prefix0x(_.id ?? "")]: _.symbol })),
    ...account.cats.map((_) => ({ [prefix0x(_.id)]: _.name }))
  );
}

export function getCatIdDict(account: AccountEntity): { [name: string]: string } {
  return Object.assign(
    {},
    ...Object.values(store.state.account.tokenInfo).map((_) => ({ [_.symbol]: prefix0x(_.id ?? "") })),
    ...account.cats.map((_) => ({ [_.name]: prefix0x(_.id) }))
  );
}

export function getTokenInfo(account: AccountEntity): TokenInfo {
  const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
  if (account.cats) {
    for (let i = 0; i < account.cats.length; i++) {
      const cat = account.cats[i];
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