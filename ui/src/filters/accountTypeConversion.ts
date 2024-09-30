import { tc } from "@/i18n/i18n";
import { AccountType } from "../../../lib-chia/models/account";

export function accountTypeConverter(accountType: AccountType): string {
  let convertedType = tc("accountManagement.ui.label.unknown");
  if (accountType == "Serial") convertedType = tc("accountManagement.ui.label.serial");
  if (accountType == "Password") convertedType = tc("accountManagement.ui.label.passPhrase");
  if (accountType == "Address") convertedType = tc("accountManagement.ui.label.address");
  if (accountType == "Legacy") convertedType = tc("accountManagement.ui.label.imported");
  if (accountType == "PublicKey") convertedType = tc("accountManagement.ui.label.publicKey");
  if (accountType == "2-2Keys") convertedType = tc("accountManagement.ui.label.2_2Keys");
  return convertedType;
}

export default { accountTypeConverter };
