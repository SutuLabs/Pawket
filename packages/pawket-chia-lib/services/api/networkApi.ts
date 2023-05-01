export async function getNetworkInfo(rpcUrl: string): Promise<NetworkResponse> {
  const resp = await fetch(rpcUrl + "Wallet/network", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const presp = await resp.json() as NetworkResponse;
  return presp;
}

export interface NetworkResponse {
  name?: string;
  prefix?: string;
  chainId?: string;
  symbol?: string;
  decimal?: number;
  explorerUrl?: string;
}