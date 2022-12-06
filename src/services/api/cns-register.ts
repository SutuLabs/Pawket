const baseUrl = "https://dev-namesite.api.pawket.app/api/"

export interface PriceResponse {
    name: string;
    price?: number;
    royaltyPercentage?: number;
    success: boolean;
    reason?: string,
    code?: string,
}

export interface Price {
    price: number;
    royaltyPercentage: number;
}

export interface RegisterResponse {
    name: string;
    offer?: string;
    image?: string;
    success: boolean;
    reason?: string,
    code?: string,
}

export async function getPrice(name: string): Promise<Price> {
    try {
        const resp = await fetch(baseUrl + "price?" + new URLSearchParams({
            "name": name,
        }), {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        const qresp = (await resp.json()) as PriceResponse;
        if (qresp.success) return { price: qresp.price ?? -1, royaltyPercentage: qresp.royaltyPercentage ?? -1 };
        return { price: -1, royaltyPercentage: -1 };
    } catch (error) {
        console.warn(error);
        return { price: -1, royaltyPercentage: -1 };
    }
}

export async function register(name: string, address = "", publicKey = "", did = "", text = ""): Promise<RegisterResponse | null> {
    try {
        const resp = await fetch(baseUrl + "register", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                address: address,
                publicKey: publicKey,
                did: did,
                text: text
            }),
        });
        const qresp = (await resp.json()) as RegisterResponse;
        return qresp;
    } catch (error) {
        console.warn(error);
        return null;
    }
}