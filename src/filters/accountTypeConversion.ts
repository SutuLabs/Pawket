import { tc } from "@/i18n/i18n";

export function accountTypeConverter(accountType: string): string {
  let convertedType = tc("accountManagement.ui.label.serial");
  if (accountType == "Password") convertedType = tc("accountManagement.ui.label.passPhrase");
  if (accountType == "Address") convertedType = tc("accountManagement.ui.label.address");
  if (accountType == "Legacy") convertedType = tc("accountManagement.ui.label.imported");
  return convertedType;
}

export default { accountTypeConverter };
