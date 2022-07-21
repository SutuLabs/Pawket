import { GetParentPuzzleRequest, GetParentPuzzleResponse } from "@/models/api";
import { rpcUrl } from "@/store/modules/network";

export async function getLineageProofPuzzle(parentCoinId: string, baseUrl: string = rpcUrl()): Promise<GetParentPuzzleResponse> {
  const resp = await fetch(baseUrl + "Wallet/get-puzzle", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(<GetParentPuzzleRequest>{
      parentCoinId
    }),
  });

  const presp = await resp.json() as GetParentPuzzleResponse;
  return presp;
}

export async function noNeedGetProof(): Promise<GetParentPuzzleResponse> {
  throw new Error("unexpected, program declared it does not need proof");
}