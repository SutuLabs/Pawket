import { PrivateKey, G1Element, ModuleInstance } from "@chiamine/bls-signatures";
import * as clvm_tools from "clvm_tools/browser";
import { Bytes, bigint_from_bytes, bigint_to_bytes } from "clvm";
import { OriginCoin, SpendBundle } from "@/models/walletModel";
import { bech32m } from "@scure/base";
import store from ".";
import utility from "./utility";

class CoinConditions {
  public static CREATE_COIN(puzzlehash: string, amount: bigint): string[] {
    return ["51", this.prefix0x(puzzlehash), this.prefix0x(Bytes.from(bigint_to_bytes(amount, { signed: true })).hex())];
  }
  public static CREATE_COIN_ANNOUNCEMENT(message: string): string[] {
    return ["60", message];
  }
  public static ASSERT_COIN_ANNOUNCEMENT(announcementId: string): string[] {
    return ["61", announcementId];
  }

  private static prefix0x(str: string): string {
    return str.startsWith("0x") ? str : "0x" + str;
  }
}

class Transfer {
  static readonly GROUP_ORDER = BigInt(bigint_from_bytes(Bytes.from("0x73EDA753299D7D483339D80809A1D80553BDA402FFFE5BFEFFFFFFFF00000001", "hex")));
  static readonly DEFAULT_HIDDEN_PUZZLE_HASH = Bytes.from("711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699", "hex");
  static readonly AGG_SIG_ME_ADDITIONAL_DATA = Bytes.from("ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb", "hex");

  public async generateSpendBundle(
    coins: OriginCoin[],
    sk_hex: string,
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): Promise<SpendBundle | null> {
    //   const sig = await this.generateSignature(coins, sk_hex,)
    // }

    // public async generateSignature(coins: CoinItem[], sk_hex: string, tgt_address: string, amount: number, fee: number, change_address: string) {
    // const coin = {      'amount': 1750000000000,
    //   'parent_coin_info': '0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001',
    //   'puzzle_hash': '0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3'    };
    if (!store.state.bls) return null;
    const BLS = store.state.bls;
    if (coins.length > 1) return null;
    const coin = coins[0];
    if (amount + fee > coin.amount) return null;

    const tgt_hex = utility.getPuzzleHashFromAddress(tgt_address);
    const change_hex = utility.getPuzzleHashFromAddress(change_address);
    const a = bigint_to_bytes(BigInt(coin.amount), { signed: true });
    const pci = Bytes.from(coin.parent_coin_info, "hex");
    const ph = Bytes.from(coin.puzzle_hash, "hex");
    const cont = pci.concat(ph).concat(a);
    const coinname = Bytes.SHA256(cont);
    // const hash = Bytes.SHA256(cont).hex();
    // console.log(hash);

    // const sk = BLS.PrivateKey.from_bytes(Bytes.from("171b33d526ab5fade9363966c5d990bdc9f7fa158ee908afb5a4c6dca35e4d75", "hex").raw(), true);
    const sk = BLS.PrivateKey.from_bytes(Bytes.from(sk_hex, "hex").raw(), true);
    // const pk = Bytes.from(sk.get_g1().serialize()).hex();
    // console.log("sk", sk, "pk", pk)
    const synthetic_sk = this.calculate_synthetic_secret_key(BLS, sk, Transfer.DEFAULT_HIDDEN_PUZZLE_HASH.raw());
    // console.log("synthetic_sk", Bytes.from(synthetic_sk.serialize()).hex())
    // var pk = sk.get_g1();

    // const delegated_puzzle_solution_treehash = Bytes.from("decd4777cff48e21c6174679f7419d2001576a2998f95621069b064351845072", "hex");
    const delegated_puzzle_solution_treehash = await this.getDelegatedPuzzleHash([
      CoinConditions.CREATE_COIN(tgt_hex, amount),
      CoinConditions.CREATE_COIN(change_hex, coin.amount - amount - fee),
    ]);
    // console.log(delegated_puzzle_solution_treehash);

    // opc -H '(q (51 0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5 0x0f4240) (51 0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3 0x0197741199c0))'


    const message = Uint8Array.from([...Bytes.from(delegated_puzzle_solution_treehash, "hex").raw(), ...coinname.raw(), ...Transfer.AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
    // console.log(synthetic_sk, delegated_puzzle_solution_treehash, coinname, AGG_SIG_ME_ADDITIONAL_DATA,  message);
    // console.log("message hex", Bytes.from(message).hex());

    const signature = BLS.AugSchemeMPL.sign(synthetic_sk, message);
    // console.log(Bytes.from(signature.serialize()).hex());

    const sig = Bytes.from(signature.serialize()).hex();

    return {
      aggregated_signature: sig,
      coin_spends: [{
        coin: coin,
        puzzle_reveal: "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0a042c855d234578415254b7870b711fb25e8f85beaa4a66bd0673d394c761fa156406c2e3bb375d5b18766d2a12cc918ff018080",
        solution: "0xff80ffff01ffff33ffa087908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5ff830f424080ffff33ffa04f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3ff860197741199c08080ff8080"
      }]
    }
  }

  public async getDelegatedPuzzleHash(conditions: string[][]): Promise<string> {
    const puzzle = "(q " + conditions.map(_ => "(" + _.join(" ") + ")").join(" ") + ")";
    await store.dispatch("initializeClvm");

    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("opc", "-H", puzzle);
    const puzzleHash = output[0];

    return puzzleHash;
  }

  private calculate_synthetic_offset(public_key: G1Element, hidden_puzzle_hash: Uint8Array): bigint {
    const blob = Bytes.SHA256(new Uint8Array([...public_key.serialize(), ...hidden_puzzle_hash]));
    let offset = bigint_from_bytes(blob, { signed: true })
    while (offset < 0) offset += Transfer.GROUP_ORDER;
    offset %= Transfer.GROUP_ORDER;
    return offset;
  }

  private calculate_synthetic_secret_key(BLS: ModuleInstance, secret_key: PrivateKey, hidden_puzzle_hash: Uint8Array): PrivateKey {
    const secret_exponent = bigint_from_bytes(Bytes.from(secret_key.serialize()), { signed: true });
    const public_key = secret_key.get_g1();
    const synthetic_offset = this.calculate_synthetic_offset(public_key, hidden_puzzle_hash);
    const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % Transfer.GROUP_ORDER
    const blob = bigint_to_bytes(synthetic_secret_exponent).raw();
    const synthetic_secret_key = BLS.PrivateKey.from_bytes(blob, true)
    return synthetic_secret_key;
  }
}

export default new Transfer();
