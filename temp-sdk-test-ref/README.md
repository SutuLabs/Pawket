# Chia Wallet SDK Bundle - Node.js Test Suite

Test suite for `chia-wallet-sdk-bundle` in Node.js environment using TypeScript and Vitest.

## Setup

```bash
yarn install
```

## Run Tests

```bash
yarn test              # Run all tests
yarn test:watch        # Run tests in watch mode
yarn test:ui           # Run tests with UI
yarn test:coverage     # Run tests with coverage report
yarn test:update       # Update snapshots
```

## Features

- ✅ **27 tests** covering CLVM, Simulator, Address, Coin, and Hex utilities
- ✅ **Snapshot testing** for deterministic outputs (address encoding, coin IDs, serialization)
- ✅ **Native WASM support** via Vitest
- ✅ **TypeScript** with full type safety
- ✅ **Zero configuration** - works out of the box

## Test Coverage

### CLVM (11 tests)
- Instance creation
- Value allocation (nil, numbers, bigints, strings, bytes, booleans)
- Pairs and lists
- Serialization/deserialization
- **Snapshot**: Serialization output

### Simulator (4 tests)
- Instance creation
- BLS wallet generation
- Wallet property validation
- Different seeds generate different wallets

### Address (4 tests)
- Address encoding
- Address decoding
- Roundtrip encoding/decoding
- **Snapshot**: Address encoding

### Coin (5 tests)
- Coin creation
- Coin ID calculation
- Consistent coin ID generation
- Expected coin ID validation
- **Snapshot**: Coin ID output

### Hex Utilities (3 tests)
- Hex to bytes conversion
- Bytes to hex conversion
- Roundtrip conversion

## Snapshot Testing

Vitest's snapshot testing is used to verify deterministic outputs:

1. **CLVM Serialization** - Ensures consistent serialization format
2. **Address Encoding** - Verifies correct bech32 encoding
3. **Coin ID** - Validates coin ID calculation

Update snapshots with: `yarn test:update`

## Why Vitest?

- ✅ **Native ESM Support** - No configuration needed
- ✅ **WASM Support** - Direct WASM module imports
- ✅ **Fast** - Powered by Vite
- ✅ **Snapshot Testing** - Built-in snapshot support
- ✅ **TypeScript** - First-class TypeScript support

## Tech Stack

- **TypeScript** - Type safety
- **Vitest** - Test runner with native ESM/WASM support
- **chia-wallet-sdk-bundle** - Chia Wallet SDK

