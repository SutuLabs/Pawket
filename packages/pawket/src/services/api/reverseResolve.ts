import { rpcUrl } from "@/store/modules/network";
import { StandardResolveAnswer, StandardResolveQuery, StandardResolveQueryResponse } from "./resolveName";
import UniStorage from "../../../../pawket-chia-lib/services/storage";

const ttl = 1000 * 60 * 60 * 24

export interface reverseResolveAnswer {
    address: string;
    cns?: string;
    expiration?: number;
    status: "Found" | "NotFound" | "Failure";
}

export async function getCnsName(addresses: string[]): Promise<reverseResolveAnswer[]> {
    const ustore = UniStorage.create();
    const value = await ustore.getItem("CNS_CACHE");
    const cnsCache = value ? JSON.parse(value) as reverseResolveAnswer[] : []
    const res: reverseResolveAnswer[] = [];
    const unresolved: string[] = [];
    for (const address of addresses) {
        const idx = cnsCache.findIndex(cache => cache.address == address && cache.cns?.endsWith('.xch') && cache.expiration && cache.expiration > Date.now());
        if (idx > -1) res.push(cnsCache[idx])
        else unresolved.push(address)
    }
    if (unresolved.length) {
        const answers = await reverseResolve(unresolved)
        for (const ans of answers) {
            if (ans.name && ans.name.endsWith('.xch') && ans.data) {
                const idx = unresolved.findIndex(u => u == ans.data)
                if (idx > -1) unresolved.splice(idx, 1);
                res.push({ address: ans.data, cns: ans.name, status: "Found" })
                cnsCache.push({ address: ans.data, cns: ans.name, expiration: Date.now() + ttl, status: "Found" });
            } else if (ans.status == "Failure") {
                res.push({ address: ans.name, status: "Failure" })
            }
        }
    }
    ustore.setItem("CNS_CACHE", JSON.stringify(cnsCache))
    const notFoundRes = unresolved.map(u => <reverseResolveAnswer>{ address: u, status: "NotFound" })
    return res.concat(notFoundRes);
}

export async function reverseResolve(addresses: string[]): Promise<StandardResolveAnswer[]> {
    try {
        const query = addresses.map(address => <StandardResolveQuery>{ name: address, type: "name" });
        const resp = await fetch(rpcUrl() + "Name/resolve", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                queries: query,
            }),
        });
        const qresp = (await resp.json()) as StandardResolveQueryResponse;
        const answer = qresp.answers;
        if (!answer) return [];
        answer.forEach(ans => ans.status)
        return answer;
    } catch (error) {
        console.warn(error);
        return addresses.map(address => <StandardResolveAnswer>{ status: "Failure", name: address });
    }
}