import puzzle from "../crypto/puzzle";
import { prefix0x } from "./condition";

export interface ModParameter {
  name: string;
  desc?: string;
}
export interface ModDetail {
  mod: string;
  name: string;
  parameters: ModParameter[];
}

export const mods: ModDetail[] = [
  {
    name: "settlement_payments",
    mod: "(a (q 2 10 (c 2 (c 3 ()))) (c (q (51 . 62) (a (i 5 (q 4 (c 12 (c (a 30 (c 2 (c 9 ()))) ())) (a 22 (c 2 (c 25 (c (a 10 (c 2 (c 13 ()))) ()))))) ()) 1) (a (i 5 (q 4 (c 8 9) (a 22 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "notarized_payments",
        desc: "`notarized_payments` is a list of notarized coin payments\na notarized coin payment is `(nonce . ((puzzle_hash amount ...) (puzzle_hash amount ...) ...))`\nEach notarized coin payment creates some `(CREATE_COIN puzzle_hash amount ...)` payments\nand a `(CREATE_PUZZLE_ANNOUNCEMENT (sha256tree notarized_coin_payment))` announcement\nThe idea is the other side of this trade requires observing the announcement from a\n`settlement_payments` puzzle hash as a condition of one or more coin spends.",
      },
    ],
  },
  {
    name: "p2_delegated_puzzle_or_hidden_puzzle",
    mod: "(a (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "synthetic_public_key",
        desc: "synthetic_public_key: the public key that is the sum of `original_public_key` and the public key corresponding to `synthetic_key_offset`",
      },
      {
        name: "original_public_key",
        desc: "original_public_key: a public key, where knowledge of the corresponding private key represents ownership of the file",
      },
      {
        name: "delegated_puzzle",
        desc: "delegated_puzzle: a delegated puzzle, as in `graftroot`, which should return the desired conditions.",
      },
      {
        name: "solution",
        desc: "solution: the solution to the delegated puzzle",
      },
    ],
  },
  {
    name: "cat",
    mod: "(a (q 2 94 (c 2 (c (c 5 (c (sha256 44 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (sha256 639 1407 2943) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((-54 . 61) 70 2 . 51) (60 . 4) 1 1 . -53) ((a 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 34 (sha256 44 52) (sha256 34 (sha256 34 (sha256 44 92) 9) (sha256 34 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 38 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) (c (c 5 39) (c (+ 11 87) 119)) 2 (i 5 (q 2 (i (= (a (i (= 17 120) (q . 89) ()) 1) (q . -113)) (q 2 122 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 90 (c 2 (c (a (i (= 17 120) (q 4 120 (c (a 54 (c 2 (c 19 (c 41 (c (sha256 44 91) (c 43 ())))))) 57)) (q 2 (i (= 17 36) (q 4 36 (c (sha256 32 41) 57)) (q . 9)) 1)) 1) (c (a (i (= 17 120) (q . 89) ()) 1) (c (a 122 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) ((a (i 5 (q 4 9 (a 38 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 34 (sha256 44 88) (sha256 34 (sha256 34 (sha256 44 92) 5) (sha256 34 (a 50 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 44 5)) 1) (c (c 40 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 122 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (sha256 1279 (a 54 (c 2 (c 9 (c 2815 (c (sha256 44 45) (c 21 ())))))) 5887) (c 1535 (c 3071 ()))))))))))) 2 42 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (sha256 39 (a 54 (c 2 (c 41 (c 87 (c (sha256 44 -71) (c 89 ())))))) -73)) ()) 1) (c 23 (c 5 (c 767 (c (c (c 36 (c (sha256 124 47 383) ())) (c (c 48 (c (sha256 -65 (sha256 124 21 (+ 383 (- 735 43) 767))) ())) 19)) ()))))))))) 1))",
    parameters: [
      {
        name: "MOD_HASH",
        desc: "MOD_HASH: this code's sha256 tree hash",
      },
      {
        name: "TAIL_PROGRAM_HASH",
        desc: "TAIL_PROGRAM_HASH: the program that determines if a coin can mint new cats, burn cats, and check if its lineage is valid if its parent is not a CAT",
      },
      {
        name: "INNER_PUZZLE",
        desc: "INNER_PUZZLE: an independent puzzle protecting the coins. Solutions to this puzzle are expected to generate `AGG_SIG` conditions and possibly `CREATE_COIN` conditions.",
      },
    ],
  },
  {
    name: "singleton_launcher",
    mod: "(a (q 4 (c 4 (c 5 (c 11 ()))) (c (c 10 (c (a 14 (c 2 (c (c 5 (c 11 (c 23 ()))) ()))) ())) ())) (c (q 51 60 2 (i (l 5) (q 11 (q . 2) (a 14 (c 2 (c 9 ()))) (a 14 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "singleton_full_puzzle_hash",
      },
      {
        name: "amount",
      },
      {
        name: "key_value_list",
      },
    ],
  },
  {
    name: "singleton_top_layer",
    mod: "(a (q 2 (i (logand 47 (q . 1)) (q 2 54 (c 2 (c 5 (c 23 (c (a 38 (c 2 (c 11 ()))) (c 47 (c 11 (c 95 ())))))))) (q 8)) 1) (c (q (((70 . 2) 51 . 4) (q . 1) 2 (a (i 5 (q 2 92 (c 2 (c 13 (c (sha256 44 (sha256 36 56) (sha256 44 (sha256 44 (sha256 36 52) 9) (sha256 44 11 (sha256 36 ())))) ())))) (q . 11)) 1) 2 (i 11 (q 2 50 (c 2 (c 5 (c 11 (c 23 (c (a 42 (c 2 (c (a (i (= 35 40) (q . -77) ()) 1) ()))) ())))))) (q 2 (i 23 () (q 8)) 1)) 1) (((sha256 (sha256 23 (a 58 (c 2 (c 9 (c 47 (c (a 38 (c 2 (c 5 ()))) ()))))) 95) 11 -65) 2 (i (not (all 79 23)) (q 2 126 (c 2 (c 111 (c (c (a (i 79 (q 4 35 (c (a 58 (c 2 (c 9 (c 83 (c (a 38 (c 2 (c 5 ()))) ()))))) (c -77 ()))) (q . 19)) 1) (a 124 (c 2 (c 5 (c 27 (c (any 79 23) ())))))) ())))) (q 8)) 1) (c (= (logand 5 (q . 1)) (q . 1)) (= 5 (q . -113))) 11 44 (sha256 36 48) (sha256 44 (sha256 44 (sha256 36 52) 5) (sha256 44 (a 92 (c 2 (c 7 (c (sha256 36 36) ())))) (sha256 36 ())))) ((a (i (l 5) (q 11 (q . 2) (a 38 (c 2 (c 9 ()))) (a 38 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 2 94 (c 2 (c 5 (c 11 (c (a 58 (c 2 (c 9 (c 23 (c (a 38 (c 2 (c 5 ()))) ()))))) (c 23 (c 47 (c 95 (c -65 ()))))))))) (c (c 32 (c 23 ())) (a 124 (c 2 (c 5 (c (a 383 (c (c (c 23 47) (c (c 95 -65) (c 11 5))) 767)) (q ())))))) (a 46 (c 2 (c 5 (c 11 (c (a (i 59 (q 2 34 (c 2 (c 5 (c 23 (c 19 (c 43 (c 91 (c 95 ())))))))) (q 2 (i (= 21 (sha256 19 29 43)) (q 11 21 23 95) (q 8)) 1)) 1) (c 23 (c 47 (c 95 (c -65 (c 383 ())))))))))) 2 (i 5 (q . 27) (q . 11)) 1) 1))",
    parameters: [
      {
        name: "SINGLETON_STRUCT",
        desc: "(MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))",
      },
      {
        name: "INNER_PUZZLE",
      },
      {
        name: "lineage_proof",
      },
      {
        name: "my_amount",
      },
      {
        name: "inner_solution",
      },
    ],
  },
  {
    name: "pool_member_innerpuz",
    mod: "(a (q 2 (i 767 (q 2 22 (c 2 (c 5 (c 1215 (c 1727 (c 383 (c (sha256 (logior 47 (logand (q . 0x00ffffffffffffffffffffffffffffffff) 767)) 11 383) ()))))))) (q 4 (c 8 (c 23 (c (a 30 (c 2 (c 383 ()))) ()))) (c (c 28 (c 95 (c 1727 ()))) ()))) 1) (c (q (50 61 . 51) 62 (c (c 28 (c 11 (c 23 ()))) (c (c 28 (c 5 (c 47 ()))) (c (c 10 (c 95 ())) (c (c 20 (c (sha256 95 (q . 36)) ())) ())))) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "POOL_PUZZLE_HASH",
        desc: "POOL_PUZZLE_HASH is commitment to the pool's puzzle hash"
      },
      {
        name: "P2_SINGLETON_PUZZLE_HASH",
        desc: "P2_SINGLETON_PUZZLE_HASH is the puzzle hash for your pay to singleton puzzle",
      },
      {
        name: "OWNER_PUBKEY",
        desc: "OWNER_PUBKEY is the farmer pubkey which authorises a travel",
      },
      {
        name: "POOL_REWARD_PREFIX",
        desc: "POOL_REWARD_PREFIX is network-specific data (mainnet vs testnet) that helps determine if a coin is a pool reward",
      },
      {
        name: "WAITINGROOM_PUZHASH",
        desc: "WAITINGROOM_PUZHASH is the puzzle_hash you'll go to when you iniate the leaving process",
      },
      {
        name: "Truths",
        desc: "",
      },
      {
        name: "p1",
        desc: "p1 is pool_reward_amount if absorbing money\np1 is extra_data key_value_list if escaping",
      },
      {
        name: "pool_reward_height",
        desc: "pool_reward_height is the block height that the reward was generated at. This is used to calculate the coin ID. \nAbsorbing money if pool_reward_height is an atom\nEscaping if pool_reward_height is ()",
      },
    ],
  },
  {
    name: "pool_waitingroom_innerpuz",
    mod: "(a (q 2 (i 383 (q 4 (c 28 (c 95 ())) (c (c 18 (c 1535 (c 1727 ()))) (c (c 8 (c 23 (c (a 30 (c 2 (c (c 1535 (c 767 ())) ()))) ()))) ()))) (q 2 22 (c 2 (c 5 (c 1215 (c 1727 (c 767 (c (sha256 (logior 47 (logand (q . 0x00ffffffffffffffffffffffffffffffff) 1535)) 11 767) ())))))))) 1) (c (q (50 61 . 82) (51 . 62) (c (c 18 (c 11 (c 23 ()))) (c (c 18 (c 5 (c 47 ()))) (c (c 26 (c 95 ())) (c (c 20 (c (sha256 95 (q . 36)) ())) ())))) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "POOL_PUZZLE_HASH",
        desc: "POOL_PUZZLE_HASH is commitment to the pool's puzzle hash",
      },
      {
        name: "P2_SINGLETON_PUZZLE_HASH",
        desc: "P2_SINGLETON_PUZZLE_HASH is the puzzlehash for your pay_to_singleton puzzle",
      },
      {
        name: "OWNER_PUBKEY",
        desc: "OWNER_PUBKEY is the farmer pubkey which signs the exit puzzle_hash",
      },
      {
        name: "POOL_REWARD_PREFIX",
        desc: "POOL_REWARD_PREFIX is network-specific data (mainnet vs testnet) that helps determine if a coin is a pool reward",
      },
      {
        name: "RELATIVE_LOCK_HEIGHT",
        desc: "RELATIVE_LOCK_HEIGHT is how long it takes to leave",
      },
      {
        name: "Truths",
        desc: "",
      },
      {
        name: "spend_type",
        desc: "spend_type is: 0 for absorbing money, 1 to escape",
      },
      {
        name: "p1",
        desc: "if spend_type is 0\np1 is pool_reward_amount - the value of the coin reward - this is passed in so that this puzzle will still work after halvenings\nif spend_type is 1\np1 is extra_data key_value_list - signed extra data that the wallet may want to publicly announce for syncing purposes",
      },
      {
        name: "p2",
        desc: "if spend_type is 0\np2 is pool_reward_height - the block height that the reward was generated at. This is used to calculate the coin ID. \nif spend_type is 1\np2 is destination_puzhash - the location that the escape spend wants to create itself to",
      },
    ],
  },
  {
    name: "genesis_by_coin_id",
    mod: "(a (i 47 (q 8) (q 2 (i (= 45 2) () (q 8)) 1)) 1)",
    parameters: [
      {
        name: "GENESIS_ID",
        desc: "The genesis_id is curried in, making this lineage_check program unique and giving the CAT it's uniqueness",
      },
      {
        name: "Truths",
        desc: "",
      },
      {
        name: "parent_is_cat",
        desc: "",
      },
      {
        name: "lineage_proof",
        desc: "",
      },
      {
        name: "delta",
        desc: "",
      },
      {
        name: "_",
        desc: "",
      },
    ],
  },
  {
    name: "singleton_top_layer_v1_1",
    mod: "(a (q 2 (i (logand 47 60) (q 4 (c 16 (c 47 ())) (c (a 62 (c 2 (c 5 (c (sha256 39 (a (i 119 (q 2 54 (c 2 (c 9 (c 87 (c (a 46 (c 2 (c 5 ()))) ()))))) (q . 29)) 1) (a (i 119 (q . -73) (q . 87)) 1)) (c 119 ()))))) (a 38 (c 2 (c 5 (c (a 11 95) (q ()))))))) (q 8)) 1) (c (q ((73 71 . 2) 51 4 . 1) (q 2 2 (i 5 (q 2 58 (c 2 (c 13 (c (sha256 42 (sha256 60 44) (sha256 42 (sha256 42 (sha256 60 18) 9) (sha256 42 11 (sha256 60 ())))) ())))) (q . 11)) 1) ((a (i 11 (q 2 (i (a (i (= 35 20) (q 2 (i (logand -77 60) (q 1 . 1) ()) 1) ()) 1) (q 2 (i (not 23) (q 2 (i (= -77 (q . -113)) (q 2 38 (c 2 (c 5 (c 27 (c 60 ()))))) (q 4 (c 35 (c (a 54 (c 2 (c 9 (c 83 (c (a 46 (c 2 (c 5 ()))) ()))))) 115)) (a 38 (c 2 (c 5 (c 27 (c 60 ()))))))) 1) (q 8)) 1) (q 4 19 (a 38 (c 2 (c 5 (c 27 (c 23 ()))))))) 1) (q 2 (i 23 () (q 8)) 1)) 1) 11 42 (sha256 60 56) (sha256 42 (sha256 42 (sha256 60 18) 5) (sha256 42 (a 58 (c 2 (c 7 (c (sha256 60 60) ())))) (sha256 60 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 60 5)) 1) 2 (i (any 23 (= 11 21)) (q 4 40 (c 11 ())) (q 8)) 1) 1))",
    parameters: [
      {
        name: "SINGLETON_STRUCT",
        desc: "(MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))",
      },
      {
        name: "INNER_PUZZLE",
        desc: "",
      },
      {
        name: "lineage_proof",
        desc: "",
      },
      {
        name: "delta",
        desc: "",
      },
      {
        name: "inner_solution",
        desc: "",
      },
    ],
  },
  {
    name: "nft_state_layer_nft1",
    mod: "(a (q 2 62 (c 2 (c 5 (c (a 47 95) (c () (c (c (c 11 (c 23 ())) (q ())) (q ()))))))) (c (q ((a . 51) 4 1 . 1) (a 2 (i 5 (q 2 26 (c 2 (c 13 (c (sha256 18 (sha256 44 20) (sha256 18 (sha256 18 (sha256 44 60) 9) (sha256 18 11 (sha256 44 ())))) ())))) (q . 11)) 1) (sha256 18 (sha256 44 16) (sha256 18 (sha256 18 (sha256 44 60) 5) (sha256 18 (a 26 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 2 (i 11 (q 2 (i (= 35 24) (q 2 (i (logand -77 44) (q 2 (i (not 23) (q 2 62 (c 2 (c 5 (c 27 (c 51 (c 47 (c 95 ()))))))) (q 8)) 1) (q 4 19 (a 62 (c 2 (c 5 (c 27 (c 23 (c 47 (c 95 ()))))))))) 1) (q 2 (i (= 35 (q . -24)) (q 2 62 (c 2 (c 5 (c 27 (c 23 (c (a (i (all (= (a 46 (c 2 (c 83 ()))) 335) (not 95)) (q 2 83 (c -113 (c 335 (c -77 ())))) (q 8)) 1) (q 1))))))) (q 4 19 (a 62 (c 2 (c 5 (c 27 (c 23 (c 47 (c 95 ()))))))))) 1)) 1) (q 4 (c 24 (c (a 22 (c 2 (c 5 (c 39 (c (sha256 44 335) (c (a 46 (c 2 (c -113 ()))) (c (sha256 44 5) ()))))))) 55)) -81)) 1) 1))",
    parameters: [
      {
        name: "NFT_STATE_LAYER_MOD_HASH",
        desc: "",
      },
      {
        name: "METADATA",
        desc: "117: `u` for uri\n104: `h` for hash\n28021: `mu` for metadata uri\n28008: `mh` for metadata hash\n27765: `lu` for license uri\n27752: `lh` for license hash\n29550: `sn` for series number\n29556: `st` for series total",
      },
      {
        name: "METADATA_UPDATER_PUZZLE_HASH",
        desc: "",
      },
      {
        name: "INNER_PUZZLE",
        desc: "",
      },
      {
        name: "inner_solution",
        desc: "",
      },
    ],
  },
  {
    name: "nft_state_layer",
    mod: "(a (q 4 (c 16 (c -65 ())) (a 62 (c 2 (c 5 (c (a 58 (c 2 (c 23 (c 11 (c (a 47 95) ()))))) (c -65 (q ()))))))) (c (q ((73 2 . 51) (c . 1) 1 . 2) (((a (i 5 (q 2 34 (c 2 (c 13 (c (sha256 60 (sha256 52 36) (sha256 60 (sha256 60 (sha256 52 44) 9) (sha256 60 11 (sha256 52 ())))) ())))) (q . 11)) 1) 2 (i 23 (q 2 (i (= 71 (q . -24)) (q 2 (i (= (a 46 (c 2 (c -89 ()))) 5) (q 2 -89 (c 11 (c 5 (c 359 ())))) (q 8)) 1) (q 2 50 (c 2 (c 5 (c 11 (c 55 ())))))) 1) (q 4 (c 11 (c 5 ())) (q ()))) 1) (a (i 5 (q 4 9 (a 42 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 38 (c 2 (c (a 50 (c 2 (c 5 (c 11 (c 23 ()))))) (c 23 ())))) ((c 9 (c (a 42 (c 2 (c 21 (c 11 ())))) ())) 11 60 (sha256 52 40) (sha256 60 (sha256 60 (sha256 52 44) 5) (sha256 60 (a 34 (c 2 (c 7 (c (sha256 52 52) ())))) (sha256 52 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 2 (i 43 (q 2 (i (= -117 56) (q 2 (i (logand 715 52) (q 2 62 (c 2 (c 5 (c (c (c 35 (c 83 ())) (c 107 ())) (c 23 (c 75 ())))))) (q 4 75 (a 62 (c 2 (c 5 (c (c (c 35 (c 83 ())) (c 107 ())) (c 23 (c 47 ())))))))) 1) (q 2 (i (> -117 ()) (q 4 75 (a 62 (c 2 (c 5 (c (c (c 35 (c 83 ())) (c 107 ())) (c 23 (c 47 ()))))))) (q 2 62 (c 2 (c 5 (c (c (c 35 (c 83 ())) (c 107 ())) (c 23 (c 47 ()))))))) 1)) 1) (q 2 (i 47 (q 4 (c 56 (c (a 54 (c 2 (c 5 (c -81 (c (sha256 52 83) (c (a 46 (c 2 (c 35 ()))) (c (sha256 52 5) ()))))))) (c 23 495))) ()) (q 8)) 1)) 1) 1))",
    parameters: [
      {
        name: "NFT_STATE_LAYER_MOD_HASH",
        desc: "",
      },
      {
        name: "METADATA",
        desc: "117: `u` for uri\n104: `h` for hash",
      },
      {
        name: "METADATA_UPDATER_PUZZLE_HASH",
        desc: "",
      },
      {
        name: "INNER_PUZZLE",
        desc: "",
      },
      {
        name: "solution",
        desc: "either to inner puzzle or metadata updater",
      },
      {
        name: "my_amount",
        desc: "",
      },
    ],
  },
  {
    name: "nft_metadata_updater_default",
    mod: "(a (q 4 (c (a (i 23 (q 2 2 (c 2 (c 5 (c 23 ())))) (q . 5)) 1) (c 11 ())) (q ())) (c (q 2 (i 5 (q 2 (i (= 17 (q . 117)) (q 4 (c (q . 117) (c 11 25)) 13) (q 4 9 (a 2 (c 2 (c 13 (c 11 ())))))) 1) ()) 1) 1))",
    parameters: [
      {
        name: "CURRENT_METADATA",
        desc: "METADATA and METADATA_UPDATER_PUZZLE_HASH are passed in as truths from the layer above",
      },
      {
        name: "METADATA_UPDATER_PUZZLE_HASH ",
        desc: "METADATA and METADATA_UPDATER_PUZZLE_HASH are passed in as truths from the layer above",
      },
      {
        name: "solution",
        desc: "",
      },
    ],
  },
  {
    name: "did_innerpuz",
    mod: "(a (q 2 (i -65 (q 2 5 383) (q 2 (i (all (= (a 126 (c 2 (c 6143 ()))) 11) (> 23 ())) (q 4 (c 40 (c 383 ())) (c (c 52 (c 767 (c 383 (c (c 767 ()) ())))) (c (c 56 (c 12287 ())) (a 38 (c 2 (c 47 (c 23 (c 6143 (c 12287 (c 767 (c 1535 (c 3071 (q ()))))))))))))) (q 8)) 1)) 1) (c (q (((49 . 61) 73 . 70) (a . 51) 60 . 4) ((q . 1) 2 2 (i 5 (q 2 58 (c 2 (c 13 (c (sha256 42 (sha256 34 60) (sha256 42 (sha256 42 (sha256 34 50) 9) (sha256 42 11 (sha256 34 ())))) ())))) (q . 11)) 1) ((a (i 23 (q 2 (i 319 (q 4 (c 48 (c (sha256 (sha256 (a 54 (c 2 (c 5 (c 39 (c 575 (c 1343 (c 2879 ()))))))) (a 126 (c 2 (c (a 46 (c 2 (c 47 (c 95 (c 383 ()))))) ())))) 47) ())) (a 38 (c 2 (c 5 (c 11 (c 55 (c 47 (c 95 (c 447 (c 383 (c (+ 767 (q . 1)) ()))))))))))) (q 2 38 (c 2 (c 5 (c 55 (c 47 (c 95 (c 447 (c 383 (c 767 ())))))))))) 1) (q 2 (i (> 767 (- 11 (q . 1))) (q 4 (c 32 (c 383 (c 95 ()))) ()) (q 8)) 1)) 1) 11 23 (a 94 (c 2 (c 9 (c 47 (c (a 126 (c 2 (c (c 9 (c 11 29)) ()))) ()))))) 95) (c (q . 1) (c (c 44 (c 5 ())) (c (c 32 (c 23 (c 11 ()))) ()))) (sha256 42 (sha256 34 36) (sha256 42 (sha256 42 (sha256 34 50) 5) (sha256 42 (a 58 (c 2 (c 7 (c (sha256 34 34) ())))) (sha256 34 ())))) 2 (i (l 5) (q 11 (q . 2) (a 126 (c 2 (c 9 ()))) (a 126 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "INNER_PUZZLE",
        desc: "Standard P2 inner puzzle, used to record the ownership of the DID",
      },
      {
        name: "RECOVERY_DID_LIST_HASH ",
        desc: "the list of DIDs that can send messages to you for recovery we store only the hash so that we don't have to reveal every time we make a message spend",
      },
      {
        name: "NUM_VERIFICATIONS_REQUIRED",
        desc: "how many of the above list are required for a recovery",
      },
      {
        name: "SINGLETON_STRUCT",
        desc: "my singleton_struct, formerly a Truth - ((SINGLETON_MOD_HASH, (LAUNCHER_ID, LAUNCHER_PUZZLE_HASH)))",
      },
      {
        name: "METADATA",
        desc: "Customized metadata, e.g KYC info",
      },
      {
        name: "mode",
        desc: "this indicates which spend mode we want. 0. Recovery mode 1. Run INNER_PUZZLE with p2_solution",
      },
      {
        name: "my_amount_or_inner_solution",
        desc: "In mode 0, we use this to recover our coin and assert it is our actual amount\nIn mode 1 this is the solution of the inner P2 puzzle, only required in the create message mode and transfer mode.",
      },
      {
        name: "new_inner_puzhash",
        desc: "In recovery mode, this will be the new wallet DID puzzle hash",
      },
      {
        name: "parent_innerpuzhash_amounts_for_recovery_ids",
        desc: "during a recovery we need extra information about our recovery list coins",
      },
      {
        name: "pubkey",
        desc: "this is the new pubkey used for a recovery",
      },
      {
        name: "recovery_list_reveal",
        desc: "this is the reveal of the stored list of DIDs approved for recovery",
      },
      {
        name: "my_id",
        desc: "my coin ID",
      },
    ],
  },
  {
    name: "nft_ownership_layer",
    mod: "(a (q 2 38 (c 2 (c 5 (c 23 (c 11 (c (a 47 95) ())))))) (c (q ((0xad4cd55cf7ad6414 2 . 51) (62 . 4) -10 . 1) ((q . 2) (a (i 5 (q 2 42 (c 2 (c 13 (c (sha256 50 (sha256 60 52) (sha256 50 (sha256 50 (sha256 60 34) 9) (sha256 50 11 (sha256 60 ())))) ())))) (q . 11)) 1) 4 (c 56 (c (a 54 (c 2 (c 5 (c 39 (c (a 46 (c 2 (c (a (i -81 (q . -81) (q . 11)) 1) ()))) (c (sha256 60 79) (c (sha256 60 5) ()))))))) 55)) 367) ((a 62 (c 2 (c 5 (c 11 (c 23 (c 47 (c 47 (q () ())))))))) 11 50 (sha256 60 40) (sha256 50 (sha256 50 (sha256 60 34) 5) (sha256 50 (a 42 (c 2 (c 7 (c (sha256 60 60) ())))) (sha256 60 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 2 (i 95 (q 2 (i (= 287 56) (q 2 (i (= (logand 1439) 60) (q 2 (i (not -65) (q 2 62 (c 2 (c 5 (c 11 (c 23 (c 47 (c -33 (c 415 (c 383 ()))))))))) (q 8)) 1) (q 4 -97 (a 62 (c 2 (c 5 (c 11 (c 23 (c 47 (c -33 (c -65 (c 383 ()))))))))))) 1) (q 2 (i (= 287 44) (q 2 (i (not 383) (q 4 (c 36 (c (concat 16 (a 46 (c 2 (c 415 ())))) ())) (a 62 (c 2 (c 5 (c 11 (c 23 (c 47 (c -33 (c -65 (c (a 11 (c 23 (c 47 (c 415 ())))) ())))))))))) (q 8)) 1) (q 2 (i (= 287 36) (q 2 (i (not (a (i (= (q . 40) (strlen 671)) (q 2 (i (= (substr 671 () (q . 8)) 16) (q 1 . 1) ()) 1) ()) 1)) (q 4 -97 (a 62 (c 2 (c 5 (c 11 (c 23 (c 47 (c -33 (c -65 (c 383 ())))))))))) (q 8)) 1) (q 4 -97 (a 62 (c 2 (c 5 (c 11 (c 23 (c 47 (c -33 (c -65 (c 383 ()))))))))))) 1)) 1)) 1) (q 2 58 (c 2 (c 5 (c 11 (c -65 (c (a (i 383 (q . 383) (q 2 11 (c 23 (c 47 (q ()))))) 1) ()))))))) 1) 1))",
    parameters: [
      {
        name: "NFT_OWNERSHIP_LAYER_MOD_HASH",
        desc: "",
      },
      {
        name: "CURRENT_OWNER ",
        desc: "",
      },
      {
        name: "TRANSFER_PROGRAM",
        desc: "",
      },
      {
        name: "INNER_PUZZLE",
        desc: "",
      },
      {
        name: "inner_solution",
        desc: "",
      },
    ],
  },
  {
    name: "nft_ownership_transfer_program_one_way_claim_with_royalties",
    mod: "(a (q 2 (i -65 (q 4 319 (c () (c (a (i (all 319 (not (= 319 47))) (q 4 (c 16 (c (sha256 (a 46 (c 2 (c 9 (c 1471 (c (a 62 (c 2 (c (c 9 (c 319 29)) ()))) ()))))) 21) ())) (a 22 (c 2 (c 11 (c 23 (c 703 (c 21 ()))))))) (q 2 22 (c 2 (c 11 (c 23 (c 703 (c 21 ()))))))) 1) ()))) (q 4 47 (q () ()))) 1) (c (q ((63 . 2) 4 1 . 1) (10000 2 2 (i 5 (q 2 58 (c 2 (c 13 (c (sha256 42 (sha256 44 20) (sha256 42 (sha256 42 (sha256 44 60) 9) (sha256 42 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 23 (q 4 (c 16 (c (sha256 -89 (a 62 (c 2 (c (c 47 (c (c 5 (c (f (divmod (* 71 11) 18)) (c (c 5 ()) ()))) ())) ())))) ())) (a 22 (c 2 (c 5 (c 11 (c 55 (c 47 ()))))))) ()) 1) (sha256 42 (sha256 44 24) (sha256 42 (sha256 42 (sha256 44 60) 5) (sha256 42 (a 58 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) 2 (i (l 5) (q 11 (q . 2) (a 62 (c 2 (c 9 ()))) (a 62 (c 2 (c 13 ())))) (q 11 44 5)) 1) 1))",
    parameters: [
      {
        name: "SINGLETON_STRUCT",
        desc: "",
      },
      {
        name: "ROYALTY_ADDRESS ",
        desc: "",
      },
      {
        name: "TRADE_PRICE_PERCENTAGE",
        desc: "",
      },
      {
        name: "Current_Owner",
        desc: "Truth",
      },
      {
        name: "conditions",
        desc: "Truth",
      },
      {
        name: "solution",
        desc: "created from the NFT's inner puzzle - solution is (new_owner trade_prices_list new_did_inner_hash)",
      },
    ],
  },
  {
    name: "generator_for_single_coin",
    mod: "(a (q 2 12 (c 2 (c (f (a 5 (c 10 (c 19 ())))) (c 23 ())))) (c (q ((= (sha256 9 (a 14 (c 2 (c 21 ()))) 45) 11) 2 (i 5 (q 2 (i (a 8 (c 2 (c 9 (c 11 ())))) (q 4 41 (c -71 ())) (q 2 12 (c 2 (c 13 (c 11 ()))))) 1) (q 8)) 1) (a (q 5 (a 62 (c 2 (c 5 ())))) (c (q ((-1 . 127) -33 . -65) ((a (i (= 11 (q . -128)) (q 4 () (c 5 ())) (q 2 (i (>s 11 24) (q 2 26 (c 2 (c (a (i (>s 11 28) (q 2 (i (>s 11 20) (q 8) (q 4 (concat (logand (q . 31) 11) (substr 5 () (q . 1))) (c (substr 5 (q . 1)) ()))) 1) (q 4 (logand (q . 63) 11) (c 5 ()))) 1) ()))) (q 4 11 (c 5 ()))) 1)) 1) 4 (substr 21 () 9) (c (substr 21 9) ())) (c (c 5 19) (c 43 ())) (a 22 (c 2 (c 9 (c (a 62 (c 2 (c 21 ()))) ())))) 2 (i (= (substr 5 () (q . 1)) 16) (q 2 46 (c 2 (c (a 62 (c 2 (c (substr 5 (q . 1)) ()))) ()))) (q 2 18 (c 2 (c (substr 5 (q . 1)) (c (substr 5 () (q . 1)) ()))))) 1) 1)) 2 (i (l 5) (q 11 (q . 2) (a 14 (c 2 (c 9 ()))) (a 14 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
    parameters: [
      {
        name: "block_program",
        desc: "",
      },
      {
        name: "(block_ref)",
        desc: "",
      },
      {
        name: "coinname",
        desc: "",
      },
    ],
  },
  {
    name: "chialisp_deserialisation",
    mod: "(a (q 5 (a 62 (c 2 (c 5 ())))) (c (q ((-1 . 127) -33 . -65) ((a (i (= 11 (q . -128)) (q 4 () (c 5 ())) (q 2 (i (>s 11 24) (q 2 26 (c 2 (c (a (i (>s 11 28) (q 2 (i (>s 11 20) (q 8) (q 4 (concat (logand (q . 31) 11) (substr 5 () (q . 1))) (c (substr 5 (q . 1)) ()))) 1) (q 4 (logand (q . 63) 11) (c 5 ()))) 1) ()))) (q 4 11 (c 5 ()))) 1)) 1) 4 (substr 21 () 9) (c (substr 21 9) ())) (c (c 5 19) (c 43 ())) (a 22 (c 2 (c 9 (c (a 62 (c 2 (c 21 ()))) ())))) 2 (i (= (substr 5 () (q . 1)) 16) (q 2 46 (c 2 (c (a 62 (c 2 (c (substr 5 (q . 1)) ()))) ()))) (q 2 18 (c 2 (c (substr 5 (q . 1)) (c (substr 5 () (q . 1)) ()))))) 1) 1))",
    parameters: [
      {
        name: "input",
        desc: "",
      },
    ],
  },
]
export const modsdict: { [mod: string]: string } = mods.reduce((acc, cur) => ({ ...acc, [cur.mod]: cur.name }), {});
export const modsprog: { [name: string]: string } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.mod }), {});
export const modsparams: { [name: string]: ModParameter[] } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.parameters }), {});

export async function modshash(name: string): Promise<string> {
  return prefix0x(await puzzle.getPuzzleHashFromPuzzle(modsprog[name]));
}
export async function modspuz(name: string): Promise<string> {
  return prefix0x(await puzzle.encodePuzzle(modsprog[name]));
}
