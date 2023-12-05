export { };

declare global {
    const cdv: CdvType;
}

declare class CdvType {
    /**
     * Commands to use when developing with chialisp
     */
    get clsp(): CdvClsp;
    /**
     * Decode a bech32m address to a puzzle hash
     */
    decode(address: string): string;
    /**
     * Encode a puzzle hash to a bech32m address
     */
    encode(puzzle_hash: string): string;
    /**
     * SHA256 hash UTF-8 strings or bytes (use 0x prefix for bytes)
     */
    hash(puzzle_hash: string): string;
    /**
     * Inspect various data structures
     */
    inspect(puzzle_hash: string): string;
}
declare class CdvClsp {
    /**
     * Build all specified CLVM files (i.e mypuz.clsp or ./puzzles/*.clsp)
     */
    build(clsp: string): string
    /**
     * Curry a program with specified arguments
     */
    curry(clsp: string, ...args: string[]): string
    /**
     * Disassemble serialized clvm into human readable form.
     */
    disassemble(hex: string): string
    /**
     * Copy the specified .clib file to the current directory (for example sha256tree)
     */
    retrieve(name: string): string
    /**
     * Return the tree hash of a clvm file or string
     */
    treehash(clsp: string): string
    /**
     * Uncurry a program and list the arguments
     */
    uncurry(clsp: string): [mod: string, args: string[]]
}