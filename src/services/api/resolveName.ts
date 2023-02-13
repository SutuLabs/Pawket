import { rpcUrl } from "@/store/modules/network";

export interface StandardResolveQueryResponse {
    answers?: StandardResolveAnswer[];
}

export interface StandardResolveAnswer {
    name?: string;
    type?: string;
    time_to_live?: number;
    data?: string;
    proof_coin_name?: string;
    proof_coin_spent_index?: number;
    nft_coin_name?: string;
    status: "Found";
}
export interface ResolveFailureAnswer {
    status: "NotFound" | "Failure";
}

export async function resolveName(name: string): Promise<StandardResolveAnswer | ResolveFailureAnswer> {
    try {
        name = name.toLowerCase()
        const resp = await fetch(rpcUrl() + "Name/resolve", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                queries: [{ name, type: "address" }],
            }),
        });
        const qresp = (await resp.json()) as StandardResolveQueryResponse;
        const answer = qresp.answers ? qresp.answers[0] : null;
        if (answer) answer.status = "Found";
        return answer || { status: "NotFound" };
    } catch (error) {
        console.warn(error);
        return { status: "Failure" };
    }
}