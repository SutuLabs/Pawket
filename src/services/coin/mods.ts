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
]
export const modsdict: { [mod: string]: string } = mods.reduce((acc, cur) => ({ ...acc, [cur.mod]: cur.name }), {});
export const modsprog: { [mod: string]: string } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.mod }), {});
export const modsparams: { [mod: string]: ModParameter[] } = mods.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.parameters }), {});
