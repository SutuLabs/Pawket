export const modsParametersYaml=`
- name: settlement_payments
  parameters:
  - name: notarized_payments
    desc: |-
      \`notarized_payments\` is a list of notarized coin payments
      a notarized coin payment is \`(nonce . ((puzzle_hash amount ...) (puzzle_hash amount ...) ...))\`
      Each notarized coin payment creates some \`(CREATE_COIN puzzle_hash amount ...)\` payments
      and a \`(CREATE_PUZZLE_ANNOUNCEMENT (sha256tree notarized_coin_payment))\` announcement
      The idea is the other side of this trade requires observing the announcement from a
      \`settlement_payments\` puzzle hash as a condition of one or more coin spends.
- name: p2_delegated_puzzle_or_hidden_puzzle
  parameters:
  - name: synthetic_public_key
    desc: 'synthetic_public_key: the public key that is the sum of \`original_public_key\`
      and the public key corresponding to \`synthetic_key_offset\`'
  - name: original_public_key
    desc: 'original_public_key: a public key, where knowledge of the corresponding
      private key represents ownership of the file'
  - name: delegated_puzzle
    desc: 'delegated_puzzle: a delegated puzzle, as in \`graftroot\`, which should return
      the desired conditions.'
  - name: solution
    desc: 'solution: the solution to the delegated puzzle'
- name: cat_v1
  parameters:
  - name: MOD_HASH
    desc: 'MOD_HASH: this code''s sha256 tree hash'
  - name: TAIL_PROGRAM_HASH
    desc: 'TAIL_PROGRAM_HASH: the program that determines if a coin can mint new cats,
      burn cats, and check if its lineage is valid if its parent is not a CAT'
  - name: INNER_PUZZLE
    desc: 'INNER_PUZZLE: an independent puzzle protecting the coins. Solutions to
      this puzzle are expected to generate \`AGG_SIG\` conditions and possibly \`CREATE_COIN\`
      conditions.'
- name: cat_v2
  parameters:
  - name: MOD_HASH
    desc: 'MOD_HASH: this code''s sha256 tree hash'
  - name: TAIL_PROGRAM_HASH
    desc: 'TAIL_PROGRAM_HASH: the program that determines if a coin can mint new cats,
      burn cats, and check if its lineage is valid if its parent is not a CAT'
  - name: INNER_PUZZLE
    desc: 'INNER_PUZZLE: an independent puzzle protecting the coins. Solutions to
      this puzzle are expected to generate \`AGG_SIG\` conditions and possibly \`CREATE_COIN\`
      conditions.'
- name: singleton_launcher
  parameters:
  - name: singleton_full_puzzle_hash
  - name: amount
  - name: key_value_list
- name: singleton_top_layer
  parameters:
  - name: SINGLETON_STRUCT
    desc: "(MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))"
  - name: INNER_PUZZLE
  - name: lineage_proof
  - name: my_amount
  - name: inner_solution
- name: pool_member_innerpuz
  parameters:
  - name: POOL_PUZZLE_HASH
    desc: POOL_PUZZLE_HASH is commitment to the pool's puzzle hash
  - name: P2_SINGLETON_PUZZLE_HASH
    desc: P2_SINGLETON_PUZZLE_HASH is the puzzle hash for your pay to singleton puzzle
  - name: OWNER_PUBKEY
    desc: OWNER_PUBKEY is the farmer pubkey which authorises a travel
  - name: POOL_REWARD_PREFIX
    desc: POOL_REWARD_PREFIX is network-specific data (mainnet vs testnet) that helps
      determine if a coin is a pool reward
  - name: WAITINGROOM_PUZHASH
    desc: WAITINGROOM_PUZHASH is the puzzle_hash you'll go to when you iniate the
      leaving process
  - name: Truths
    desc: ''
  - name: p1
    desc: |-
      p1 is pool_reward_amount if absorbing money
      p1 is extra_data key_value_list if escaping
  - name: pool_reward_height
    desc: "pool_reward_height is the block height that the reward was generated at.
      This is used to calculate the coin ID. \nAbsorbing money if pool_reward_height
      is an atom\nEscaping if pool_reward_height is ()"
- name: pool_waitingroom_innerpuz
  parameters:
  - name: POOL_PUZZLE_HASH
    desc: POOL_PUZZLE_HASH is commitment to the pool's puzzle hash
  - name: P2_SINGLETON_PUZZLE_HASH
    desc: P2_SINGLETON_PUZZLE_HASH is the puzzlehash for your pay_to_singleton puzzle
  - name: OWNER_PUBKEY
    desc: OWNER_PUBKEY is the farmer pubkey which signs the exit puzzle_hash
  - name: POOL_REWARD_PREFIX
    desc: POOL_REWARD_PREFIX is network-specific data (mainnet vs testnet) that helps
      determine if a coin is a pool reward
  - name: RELATIVE_LOCK_HEIGHT
    desc: RELATIVE_LOCK_HEIGHT is how long it takes to leave
  - name: Truths
    desc: ''
  - name: spend_type
    desc: 'spend_type is: 0 for absorbing money, 1 to escape'
  - name: p1
    desc: |-
      if spend_type is 0
      p1 is pool_reward_amount - the value of the coin reward - this is passed in so that this puzzle will still work after halvenings
      if spend_type is 1
      p1 is extra_data key_value_list - signed extra data that the wallet may want to publicly announce for syncing purposes
  - name: p2
    desc: "if spend_type is 0\np2 is pool_reward_height - the block height that the
      reward was generated at. This is used to calculate the coin ID. \nif spend_type
      is 1\np2 is destination_puzhash - the location that the escape spend wants to
      create itself to"
- name: genesis_by_coin_id
  parameters:
  - name: GENESIS_ID
    desc: The genesis_id is curried in, making this lineage_check program unique and
      giving the CAT it's uniqueness
  - name: Truths
    desc: ''
  - name: parent_is_cat
    desc: ''
  - name: lineage_proof
    desc: ''
  - name: delta
    desc: ''
  - name: _
    desc: ''
- name: singleton_top_layer_v1_1
  parameters:
  - name: SINGLETON_STRUCT
    desc: "(MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))"
  - name: INNER_PUZZLE
    desc: ''
  - name: lineage_proof
    desc: ''
  - name: my_amount
    desc: ''
  - name: inner_solution
    desc: ''
- name: nft_state_layer
  parameters:
  - name: NFT_STATE_LAYER_MOD_HASH
    desc: ''
  - name: METADATA
    desc: |-
      117: \`u\` for uri
      104: \`h\` for hash
      28021: \`mu\` for metadata uri
      28008: \`mh\` for metadata hash
      27765: \`lu\` for license uri
      27752: \`lh\` for license hash
      29550: \`sn\` for series number
      29556: \`st\` for series total
  - name: METADATA_UPDATER_PUZZLE_HASH
    desc: ''
  - name: INNER_PUZZLE
    desc: ''
  - name: inner_solution
    desc: ''
- name: nft_metadata_updater_default
  parameters:
  - name: CURRENT_METADATA
    desc: METADATA and METADATA_UPDATER_PUZZLE_HASH are passed in as truths from the
      layer above
  - name: 'METADATA_UPDATER_PUZZLE_HASH '
    desc: METADATA and METADATA_UPDATER_PUZZLE_HASH are passed in as truths from the
      layer above
  - name: solution
    desc: ''
- name: did_innerpuz
  parameters:
  - name: INNER_PUZZLE
    desc: Standard P2 inner puzzle, used to record the ownership of the DID
  - name: 'RECOVERY_DID_LIST_HASH '
    desc: the list of DIDs that can send messages to you for recovery we store only
      the hash so that we don't have to reveal every time we make a message spend
  - name: NUM_VERIFICATIONS_REQUIRED
    desc: how many of the above list are required for a recovery
  - name: SINGLETON_STRUCT
    desc: my singleton_struct, formerly a Truth - ((SINGLETON_MOD_HASH, (LAUNCHER_ID,
      LAUNCHER_PUZZLE_HASH)))
  - name: METADATA
    desc: Customized metadata, e.g KYC info
  - name: mode
    desc: this indicates which spend mode we want. 0. Recovery mode 1. Run INNER_PUZZLE
      with p2_solution
  - name: my_amount_or_inner_solution
    desc: |-
      In mode 0, we use this to recover our coin and assert it is our actual amount
      In mode 1 this is the solution of the inner P2 puzzle, only required in the create message mode and transfer mode.
  - name: new_inner_puzhash
    desc: In recovery mode, this will be the new wallet DID puzzle hash
  - name: parent_innerpuzhash_amounts_for_recovery_ids
    desc: during a recovery we need extra information about our recovery list coins
  - name: pubkey
    desc: this is the new pubkey used for a recovery
  - name: recovery_list_reveal
    desc: this is the reveal of the stored list of DIDs approved for recovery
  - name: my_id
    desc: my coin ID
- name: nft_ownership_layer
  parameters:
  - name: NFT_OWNERSHIP_LAYER_MOD_HASH
    desc: ''
  - name: 'CURRENT_OWNER '
    desc: ''
  - name: TRANSFER_PROGRAM
    desc: ''
  - name: INNER_PUZZLE
    desc: ''
  - name: inner_solution
    desc: ''
- name: nft_ownership_transfer_program_one_way_claim_with_royalties
  parameters:
  - name: SINGLETON_STRUCT
    desc: ''
  - name: 'ROYALTY_ADDRESS '
    desc: ''
  - name: TRADE_PRICE_PERCENTAGE
    desc: ''
  - name: Current_Owner
    desc: Truth
  - name: conditions
    desc: Truth
  - name: solution
    desc: created from the NFT's inner puzzle - solution is (new_owner trade_prices_list
      new_did_inner_hash)
- name: chialisp_deserialisation
  parameters:
  - name: input
    desc: ''
- name: generator
  parameters:
  - name: block_program
    desc: ''
  - name: block_ref
    desc: ''

- name: add_liquidity
  parameters:
  - name: CAT_MOD_HASH
    desc: sha256tree of the cat_v2 module (uncurried)
  - name: LIQUIDITY_TAIL_MOD_HASH
    desc: sha256 tree of the liquidity TAIL (uncurried)
  - name: current_state
  - name: params
  - name: my_singleton_struct

- name: liquidity_tail
  parameters:
  - name: SINGLETON_STRUCT
    desc: pair / controller SINGLETON_STRUCT; to quote did_innerpuz.clvm, 
  - name: Truths
    desc: 'my singleton_struct, formerly a Truth - ((SINGLETON_MOD_HASH, (LAUNCHER_ID, LAUNCHER_PUZZLE_HASH)))'
  - name: parent_is_cat
  - name: lineage_proof
  - name: delta
  - name: inner_conditions
  - name: tail_solution 
    desc: (singleton_inner_puzzle_hash)

- name: p2_merkle_tree_modified
  parameters:
  - name: INNER_PUZZLE
  - name: MERKLE_ROOT
  - name: CURRIED_ARGS
    desc: (liquidity . (xch_reserve token_reserve)) (state)
  - name: parameters
  - name: merkle_proof
  - name: inner_solution

- name: p2_singleton_flashloan
  parameters:
  - name: SINGLETON_MOD_HASH
  - name: LAUNCHER_ID
  - name: LAUNCHER_PUZZLE_HASH
  - name: singleton_inner_puzzle_hash
  - name: my_id
  - name: additional_output_conditions
    desc: literally anyone can modify these - please be careful

- name: pair_inner_puzzle
  parameters:
  - name: P2_MERKLE_TREE_MODIFIED_MOD_HASH
    desc: sha256 of the parent module / puzzle (uncurried)
  - name: SINGLETON_STRUCT
    desc: to quote did_innerpuz.clvm, 'my singleton_struct, formerly a Truth - ((SINGLETON_MOD_HASH, (LAUNCHER_ID, LAUNCHER_PUZZLE_HASH)))'
  - name: P2_SINGLETON_FLASHLOAN_MOD_HASH
    desc: sha256tree of the p2_singleton_flashloan module (uncurried)
  - name: CAT_MOD_HASH
    desc: sha256tree of the cat_v2 module (uncurried)
  - name: SETTLEMENT_PAYMENTS_MOD_HASH
    desc: sha256 tree of settlement_payments.clvm (not that it has any curried arguments, but still)
  - name: TAIL_HASH
    desc: identifies the token this pair holds
  - name: inner_puzzle
    desc: |
      this is verified to be included in the merkle tree in p2_merkle_tree
      puzzle returns the new state, CURRIED_ARGS = (liquidity . (xch_reserve token_reserve)), and a list of extra conditions
      (new_state . extra_conditions)
  - name: pair_inner_puzzle_hash
  - name: merkle_root
  - name: state
  - name: inner_solution
    desc: given by the user; format (coin_ids . new_state_solution) = ((my_coin_id . (xch_reserve_coin_id . token_reserve_coin_id)) . new_state_solution)
- name: remove_liquidity
  parameters:
  - name: CAT_MOD_HASH
    desc: sha256tree of the cat_v2 module (uncurried)
  - name: LIQUIDITY_TAIL_MOD_HASH
    desc: sha256 tree of the liquidity TAIL (uncurried)
  - name: current_state
  - name: params
  - name: my_singleton_struct
- name: router
  parameters:
  - name: PAIR_INNER_PUZZLE_MOD_HASH
  - name: SINGLETON_MOD_HASH
    desc: pay attention here - it's not SINGLETON_STRUCT
  - name: P2_MERKLE_TREE_MODIFIED_MOD_HASH
  - name: P2_SINGLETON_FLASHLOAN_MOD_HASH
  - name: CAT_MOD_HASH
  - name: SETTLEMENT_PAYMENTS_MOD_HASH
  - name: MERKLE_ROOT
    desc: calculated off-chain
  - name: LAUNCHER_PUZZLE_HASH
  - name: ROUTER_MOD_HASH
    desc: my mod hash (for re-creation) ; required for the router to work
  - name: my_coin_id
  - name: new_pair_tail_hash
    desc: hash of TAIL
- name: swap
  parameters:
  - name: INVERSE_FEE
    desc: |
      this cleverly-named variable is calculated as 1000 - FEE
      FEE is, for example, 7 for 0.7% (will get divided by a thousand)
      meaning INVERSE_FEE is 993 (user swaps 99.3% of their input assets to output - tokens or XCH)
      0.7% is kept as lp fee
  - name: current_state
  - name: params
  - name: my_singleton_struct
`;
