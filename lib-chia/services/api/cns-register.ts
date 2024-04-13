const royaltyAddress = process.env.VUE_APP_ROYALTY_ADDRESS ?? "";
function getBaseUrl(chainId: string) {
  return chainId == "37a90eb5185a9c4439a91ddc98bbadce7b4feba060d50116a067de66bf236615"
    ? process.env.VUE_APP_API_TESTNET_CNS_URL ?? "https://testnet.cns.api.pawket.app/"
    : process.env.VUE_APP_API_CNS_URL ?? "https://cns.api.pawket.app/";
}

export interface PriceResponse {
  name: string;
  price?: number;
  annualFee?: number;
  regYear?: number;
  registrationFee?: number;
  royaltyPercentage?: number;
  success: boolean;
  reason?: string;
  code?: string;
  arguments?: string[];
}

export interface Price {
  name: string;
  price: number;
  royaltyPercentage: number;
  annualFee: number;
  regYear: number;
  registrationFee: number;
  reason?: string;
  code?: string;
  arguments?: string[];
}

export interface RegisterResponse {
  name: string;
  offer?: string;
  image?: string;
  success: boolean;
  reason?: string;
  code?: string;
}

export async function getPrice(name: string, year: number, renew: boolean, chainId: string): Promise<Price> {
  const baseUrl = getBaseUrl(chainId);
  try {
    const resp = await fetch(
      baseUrl +
        "api/price?" +
        new URLSearchParams({
          name: name,
          year: year.toString(),
          renew: renew.toString(),
        }),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const qresp = (await resp.json()) as PriceResponse;
    if (qresp.success)
      return {
        name: qresp.name ?? "",
        price: qresp.price ?? -1,
        annualFee: qresp.annualFee ?? -1,
        regYear: qresp.regYear ?? -1,
        registrationFee: qresp.registrationFee ?? -1,
        royaltyPercentage: qresp.royaltyPercentage ?? -1,
      };
    return {
      name: "",
      price: -1,
      annualFee: -1,
      regYear: -1,
      registrationFee: -1,
      royaltyPercentage: -1,
      reason: qresp.reason,
      code: qresp.code,
      arguments: qresp.arguments,
    };
  } catch (error) {
    console.warn(error);
    return { name: "", price: -1, annualFee: -1, regYear: -1, registrationFee: -1, royaltyPercentage: -1 };
  }
}

export async function register(
  name: string,
  year: number,
  renew: boolean,
  chainId: string,
  address = "",
  publicKey = "",
  did = "",
  text = ""
): Promise<RegisterResponse | null> {
  const baseUrl = getBaseUrl(chainId);
  try {
    const resp = await fetch(baseUrl + "api/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        royaltyAddress: royaltyAddress,
        address: address,
        publicKey: publicKey,
        did: did,
        text: text,
        renew: renew,
        year: year,
      }),
    });
    const qresp = (await resp.json()) as RegisterResponse;
    return qresp;
  } catch (error) {
    console.warn(error);
    return null;
  }
}
