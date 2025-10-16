import { describe, test, expect, beforeAll } from "vitest";
import { Clvm, Simulator, Address, Coin, fromHex, toHex } from "chia-wallet-sdk-bundle";

describe("Chia Wallet SDK Bundle", () => {
  let clvm: Clvm;
  let simulator: Simulator;

  beforeAll(() => {
    clvm = new Clvm();
    simulator = new Simulator();
  });

  describe("CLVM", () => {
    test("should create CLVM instance", () => {
      expect(clvm).toBeDefined();
      expect(clvm).toBeInstanceOf(Clvm);
    });

    test("should allocate nil", () => {
      const nil = clvm.nil();
      expect(nil).toBeDefined();
    });

    test("should allocate number", () => {
      const number = clvm.alloc(42);
      expect(number).toBeDefined();
    });

    test("should allocate bigint", () => {
      const bigNumber = clvm.alloc(100n);
      expect(bigNumber).toBeDefined();
    });

    test("should allocate string", () => {
      const string = clvm.alloc("Hello, Chia!");
      expect(string).toBeDefined();
    });

    test("should allocate bytes", () => {
      const bytes = clvm.alloc(fromHex("deadbeef"));
      expect(bytes).toBeDefined();
    });

    test("should allocate boolean", () => {
      const boolean = clvm.alloc(true);
      expect(boolean).toBeDefined();
    });

    test("should create pairs", () => {
      const number = clvm.alloc(42);
      const string = clvm.alloc("test");
      const pair = clvm.pair(number, string);
      expect(pair).toBeDefined();
    });

    test("should create lists", () => {
      const list = clvm.alloc([1, 2, 3, "test", true]);
      expect(list).toBeDefined();
    });

    test("should serialize and deserialize", () => {
      const list = clvm.alloc([1, 2, 3, "test", true]);
      const serialized = list.serialize();
      expect(serialized).toBeDefined();
      expect(serialized).toBeInstanceOf(Uint8Array);

      const deserialized = clvm.deserialize(serialized);
      expect(deserialized).toBeDefined();
    });

    test("should match serialization snapshot", () => {
      const list = clvm.alloc([1, 2, 3, "test", true]);
      const serialized = list.serialize();
      const hex = toHex(serialized);

      expect(hex).toMatchSnapshot();
    });
  });

  describe("Simulator", () => {
    test("should create Simulator instance", () => {
      expect(simulator).toBeDefined();
      expect(simulator).toBeInstanceOf(Simulator);
    });

    test("should generate BLS wallet", () => {
      const alice = simulator.bls(1n);
      expect(alice).toBeDefined();
      expect(alice.pk).toBeDefined();
      expect(alice.puzzleHash).toBeDefined();
      expect(alice.coin).toBeDefined();
    });

    test("should generate wallet with valid properties", () => {
      const wallet1 = simulator.bls(1n);
      // Note: Simulator generates different wallets each time, not deterministic
      expect(wallet1.pk).toBeDefined();
      expect(wallet1.pk.toBytes()).toBeInstanceOf(Uint8Array);
      expect(wallet1.puzzleHash).toBeDefined();
      expect(wallet1.puzzleHash).toBeInstanceOf(Uint8Array);
    });

    test("should generate different wallets for different seeds", () => {
      const wallet1 = simulator.bls(1n);
      const wallet2 = simulator.bls(2n);

      expect(toHex(wallet1.pk.toBytes())).not.toBe(toHex(wallet2.pk.toBytes()));
      expect(toHex(wallet1.puzzleHash)).not.toBe(toHex(wallet2.puzzleHash));
    });
  });

  describe("Address", () => {
    test("should encode address", () => {
      const alice = simulator.bls(1n);
      const address = new Address(alice.puzzleHash, "xch");
      const encoded = address.encode();

      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe("string");
      expect(encoded).toMatch(/^xch1/);
    });

    test("should decode address", () => {
      const alice = simulator.bls(1n);
      const address = new Address(alice.puzzleHash, "xch");
      const encoded = address.encode();

      const decoded = Address.decode(encoded);
      expect(decoded).toBeDefined();
      expect(toHex(decoded.puzzleHash)).toBe(toHex(alice.puzzleHash));
    });

    test("should encode and decode roundtrip", () => {
      const originalPuzzleHash = fromHex("aca490e9f3ebcafa3d5342d347db2703b31029511f5b40c11441af1c961f6585");
      const address = new Address(originalPuzzleHash, "xch");
      const encoded = address.encode();
      const decoded = Address.decode(encoded);

      expect(toHex(decoded.puzzleHash)).toBe(toHex(originalPuzzleHash));
    });

    test("should match address encoding snapshot", () => {
      const puzzleHash = fromHex("aca490e9f3ebcafa3d5342d347db2703b31029511f5b40c11441af1c961f6585");
      const address = new Address(puzzleHash, "xch");
      const encoded = address.encode();
      
      expect(encoded).toMatchSnapshot();
    });
  });

  describe("Coin", () => {
    test("should create coin", () => {
      const parentCoinId = fromHex("4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a");
      const puzzleHash = fromHex("dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986");
      const amount = 100n;
      
      const coin = new Coin(parentCoinId, puzzleHash, amount);
      expect(coin).toBeDefined();
      expect(coin).toBeInstanceOf(Coin);
    });

    test("should calculate coin ID", () => {
      const parentCoinId = fromHex("4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a");
      const puzzleHash = fromHex("dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986");
      const amount = 100n;

      const coin = new Coin(parentCoinId, puzzleHash, amount);
      const coinId = coin.coinId();

      expect(coinId).toBeDefined();
      expect(coinId).toBeInstanceOf(Uint8Array);
      expect(coinId.length).toBe(32);
    });

    test("should generate consistent coin ID", () => {
      const parentCoinId = fromHex("4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a");
      const puzzleHash = fromHex("dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986");
      const amount = 100n;

      const coin1 = new Coin(parentCoinId, puzzleHash, amount);
      const coin2 = new Coin(parentCoinId, puzzleHash, amount);

      expect(toHex(coin1.coinId())).toBe(toHex(coin2.coinId()));
    });

    test("should generate expected coin ID", () => {
      const parentCoinId = fromHex("4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a");
      const puzzleHash = fromHex("dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986");
      const amount = 100n;

      const coin = new Coin(parentCoinId, puzzleHash, amount);
      const coinId = toHex(coin.coinId());

      expect(coinId).toBe("fd3e669c27be9d634fe79f1f7d7d8aaacc3597b855cffea1d708f4642f1d542a");
    });

    test("should match coin ID snapshot", () => {
      const parentCoinId = fromHex("4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a");
      const puzzleHash = fromHex("dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986");
      const amount = 100n;

      const coin = new Coin(parentCoinId, puzzleHash, amount);
      const coinId = toHex(coin.coinId());

      expect(coinId).toMatchSnapshot();
    });
  });

  describe("Hex utilities", () => {
    test("should convert hex to bytes", () => {
      const hex = "deadbeef";
      const bytes = fromHex(hex);

      expect(bytes).toBeDefined();
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(4);
    });

    test("should convert bytes to hex", () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const hex = toHex(bytes);

      expect(hex).toBe("deadbeef");
    });

    test("should roundtrip hex conversion", () => {
      const original = "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a";
      const bytes = fromHex(original);
      const result = toHex(bytes);

      expect(result).toBe(original);
    });
  });
});
