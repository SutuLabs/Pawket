import { rpcUrl } from "@/store/modules/network";

export interface StandardResolveQueryRequest {
    queries?: StandardResolveQuery[];
}
export interface StandardResolveQueryResponse {
    answers?: StandardResolveAnswer[];
}
export interface StandardResolveQuery {
    name: string;
    type: string;
}
export interface StandardResolveAnswer {
    name: string;
    type?: string;
    time_to_live?: number;
    data?: string;
    proof_coin_name?: string;
    proof_coin_spent_index?: number;
    nft_coin_name?: string;
    status: "Found" | "NotFound" | "Failure";
}

export type resolveType = "address" | "did" | "publicKey" | "text" | "name";

export async function resolveName(
    name: string,
    resType: resolveType = "address"
): Promise<StandardResolveAnswer> {
    try {
        const query = resType == "address" ? name.toLowerCase() : name;
        const resp = await fetch(rpcUrl() + "Name/resolve", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                queries: [{ name: query, type: resType }],
            }),
        });
        const qresp = (await resp.json()) as StandardResolveQueryResponse;
        const answer = qresp.answers?.at(0);
        if (answer) answer.status = "Found";
        return answer || { status: "NotFound", name: name };
    } catch (error) {
        console.warn(error);
        return { status: "Failure", name: name };
    }
}