# Chia Wallet SDK WASM Migration Guide

## Overview

This guide helps migrate from the old Chia SDK to the new WASM-based `chia-wallet-sdk-bundle`.

## Installation

```bash
npm install chia-wallet-sdk-bundle
```

## Type Mappings

| Old Type     | New WASM Type | Notes                  |
| ------------ | ------------- | ---------------------- |
| `SExp`       | `Program`     | Main CLVM program type |
| `G2Element`  | `Signature`   | BLS signature          |
| `PrivateKey` | `SecretKey`   | BLS private key        |
| `G1Element`  | `PublicKey`   | BLS public key         |
| `Bytes`      | `Uint8Array`  | Standard JS byte array |
| `Tuple`      | `Pair`        | CLVM pair type         |

## Function Mappings

### CLVM Operations

| Old Function               | New WASM Equivalent                           |
| -------------------------- | --------------------------------------------- |
| `compile_run(run)`         | `program.compile()`                           |
| `run(brun)`                | `program.run(solution, maxCost, mempoolMode)` |
| `get puzzle hash (opc -H)` | `program.treeHash()`                          |
| `encode puzzle (opc)`      | `program.serialize()`                         |
| `disassemblePuzzle(opd)`   | `clvm.deserialize(fromHex(hexString))`        |
| `assemble`                 | `clvm.parse(programString)`                   |
| `disassemble`              | `program.unparse()`                           |
| `curry`                    | `program.curry(args)`                         |
| `uncurry`                  | `program.uncurry()`                           |
| `to_sexp_f`                | `clvm.alloc(value)`                           |
| `sexp_from_stream`         | `clvm.deserialize(bytes)`                     |
| `SExp.cons()`              | `clvm.pair(first, rest)`                      |
| `bigint_to_bytes`          | `program.toInt()` → `toHex()`                 |
| `sha256tree`               | `treeHashAtom()`, `treeHashPair()`            |

### BLS Operations

| Old Function      | New WASM Equivalent                                                   |
| ----------------- | --------------------------------------------------------------------- |
| `getSyntheticKey` | `secretKey.deriveSynthetic()` / `publicKey.deriveSynthetic()`         |
| Key derivation    | `secretKey.deriveHardenedPath()` / `secretKey.deriveUnhardenedPath()` |
| `bech32m.encode`  | `address.encode()`                                                    |
| `bech32m.decode`  | `Address.decode(addressString)`                                       |

## Usage Examples

### Basic Setup

```typescript
import { Clvm, SecretKey, PublicKey, Address, fromHex, toHex } from "chia-wallet-sdk-bundle";

// Initialize CLVM instance
const clvm = new Clvm();
```

### Program Operations

```typescript
// Parse string to Program
const program = clvm.parse("(q . 1)");

// Serialize Program to bytes
const bytes = program.serialize();

// Deserialize bytes to Program
const program2 = clvm.deserialize(bytes);

// Create Program from hex
const program3 = clvm.deserialize(fromHex("ff80ff80..."));

// Get puzzle hash
const puzzleHash = program.treeHash();

// Curry program
const curried = program.curry([clvm.alloc(42)]);

// Uncurry program
const uncurried = program.uncurry();
```

### BLS Key Operations

```typescript
// Create secret key from bytes
const secretKey = SecretKey.fromBytes(privateKeyBytes);

// Derive keys
const derivedKey = secretKey.deriveHardenedPath([44, 8444, 0, 0]);
const syntheticKey = secretKey.deriveSynthetic();

// Get public key
const publicKey = secretKey.publicKey();

// Sign message
const signature = secretKey.sign(message);
```

### Address Operations

```typescript
// Create address from puzzle hash
const puzzleHash = fromHex("aca490e9f3ebcafa3d5342d347db2703b31029511f5b40c11441af1c961f6585");
const address = new Address(puzzleHash, "xch");

// Encode to bech32m
const encodedAddress = address.encode();

// Decode from bech32m
const decodedAddress = Address.decode(encodedAddress);
```

### Tree Hashing

```typescript
import { treeHashAtom, treeHashPair } from "chia-wallet-sdk-bundle";

// Hash atom
const atomHash = treeHashAtom(atomBytes);

// Hash pair
const pairHash = treeHashPair(firstBytes, restBytes);
```

## Other migrations

### Instance

```typescript
const BLS = Instance.BLS;
if (!BLS) throw new Error("BLS not initialized");
```

This is not need anymore.

### FromHex

```typescript
Bytes.from(unprefix0x(hex), "hex").raw();
```

to

```typescript
import { fromHex } from "chia-wallet-sdk-bundle";
fromHex(unprefix0x(hex));
```

### ToHex

```typescript
Bytes.from(agg_sig.toBytes()).hex();
```

to

```typescript
import { toHex } from "chia-wallet-sdk-bundle";
toHex(agg_sig.toBytes());
```

### Aggregation

```typescript
AugSchemeMPL.aggregate_verify(pks, msgs, aggsig);
```

to

```typescript
PublicKey.aggregateVerify(pks, msgs, aggsig);
```

### bigint to bytes

```typescript
prefix0x(fromHex(bigint_to_bytes(amount, { signed: true })));
```

to

```typescript
import { bigint_to_bytes } from "services/crypto/utility";
prefix0x(toHex(bigint_to_bytes(amount)));
```

## Important Notes

### Memory Management

- **Always call `.free()`** on WASM objects when done to prevent memory leaks
- Example: `const key = SecretKey.fromBytes(bytes); /* use it */ key.free();`

### Error Handling

- WASM methods can throw errors for invalid inputs
- Wrap calls in try-catch blocks

### Initialization

- **Must initialize `Clvm` instance** before using CLVM operations
- `Clvm` methods are instance methods, not static

### Key Differences

- `PublicKey` only supports unhardened derivation (`deriveUnhardenedPath()`)
- `SecretKey` supports both hardened and unhardened derivation
- All WASM objects need explicit memory management

## Migration Checklist

- [ ] Replace old type imports with new WASM types
- [ ] Initialize `Clvm` instance for CLVM operations
- [ ] Update function calls to use new method names
- [ ] Add memory management with `.free()` calls
- [ ] Add error handling for WASM operations
- [ ] Test all BLS key derivation paths
- [ ] Verify address encoding/decoding works correctly
