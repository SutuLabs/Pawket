import { GetParentPuzzleRequest, GetParentPuzzleResponse } from "../../models/api";

export async function getLineageProofPuzzle(parentCoinId: string, baseUrl: string): Promise<GetParentPuzzleResponse> {
  const resp = await fetch(baseUrl + "Wallet/get-puzzle", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(<GetParentPuzzleRequest>{
      parentCoinId,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Failed to fetch lineage proof: ${resp.status} ${resp.statusText} — ${errText}`);
  }

  const presp = (await resp.json()) as GetParentPuzzleResponse;
  return presp;
}

export async function noNeedGetProof(): Promise<GetParentPuzzleResponse> {
  throw new Error("unexpected, program declared it does not need proof");
}
