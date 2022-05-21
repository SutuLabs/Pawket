import { Bytes, bigint_from_bytes } from "clvm";

export const GROUP_ORDER = BigInt(bigint_from_bytes(Bytes.from("0x73EDA753299D7D483339D80809A1D80553BDA402FFFE5BFEFFFFFFFF00000001", "hex")));
export const DEFAULT_HIDDEN_PUZZLE_HASH = Bytes.from("711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699", "hex");