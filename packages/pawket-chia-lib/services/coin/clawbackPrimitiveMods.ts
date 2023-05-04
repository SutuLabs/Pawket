export type ClawbackPrimitiveModName = "augmented_condition" | "p2_1_of_n" | "p2_puzzle_hash";

export const clawbackPrimitiveModsProg: { [name in ClawbackPrimitiveModName]: string } = {
  "augmented_condition": "(a (q 2 (i (= (a 2 (c 2 (c 23 ()))) 11) (q 4 5 (a 23 47)) (q 8)) 1) (c (q 2 (i (l 5) (q 11 (q . 2) (a 2 (c 2 (c 9 ()))) (a 2 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
  "p2_1_of_n": "(a (q 2 (i (= 5 (a 6 (c 2 (c (sha256 (q . 1) (a 4 (c 2 (c 23 ())))) (c 11 ()))))) (q 2 23 47) (q 8)) 1) (c (q (a (i (l 5) (q 11 (q . 2) (a 4 (c 2 (c 9 ()))) (a 4 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 2 (i 27 (q 2 6 (c 2 (c (a (i (logand (q . 1) 19) (q 11 (q . 2) 43 5) (q 11 (q . 2) 5 43)) 1) (c (c (lsh 19 (q . -1)) 59) ())))) (q . 5)) 1) 1))",
  "p2_puzzle_hash": "(a (q 2 (i (= 5 (a 2 (c 2 (c 11 ())))) (q 2 11 23) (q 8)) 1) (c (q 2 (i (l 5) (q 11 (q . 2) (a 2 (c 2 (c 9 ()))) (a 2 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))"
};

export const clawbackPrimitiveModsHex: { [name in ClawbackPrimitiveModName]: string } = {
  "augmented_condition": "ff02ffff01ff02ffff03ffff09ffff02ff02ffff04ff02ffff04ff17ff80808080ff0b80ffff01ff04ff05ffff02ff17ff2f8080ffff01ff088080ff0180ffff04ffff01ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff02ffff04ff02ffff04ff09ff80808080ffff02ff02ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080",
  "p2_1_of_n": "ff02ffff01ff02ffff03ffff09ff05ffff02ff06ffff04ff02ffff04ffff0bffff0101ffff02ff04ffff04ff02ffff04ff17ff8080808080ffff04ff0bff808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff04ffff01ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff04ffff04ff02ffff04ff09ff80808080ffff02ff04ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff02ffff03ff1bffff01ff02ff06ffff04ff02ffff04ffff02ffff03ffff18ffff0101ff1380ffff01ff0bffff0102ff2bff0580ffff01ff0bffff0102ff05ff2b8080ff0180ffff04ffff04ffff17ff13ffff0181ff80ff3b80ff8080808080ffff010580ff0180ff018080",
  "p2_puzzle_hash": "ff02ffff01ff02ffff03ffff09ff05ffff02ff02ffff04ff02ffff04ff0bff8080808080ffff01ff02ff0bff1780ffff01ff088080ff0180ffff04ffff01ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff02ffff04ff02ffff04ff09ff80808080ffff02ff02ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080"
};

export const clawbackPrimitiveModsHash: { [name in ClawbackPrimitiveModName]: string } = {
  "augmented_condition": "ae7a146f8b13291d8a863eebabea2720a432364a3f8ca376630262d56481a7fd",
  "p2_1_of_n": "46b29fd87fbeb6737600c4543931222a6c1ed3db6fa5601a3ca284a9f4efe780",
  "p2_puzzle_hash": "13e29a62b42cd2ef72a79e4bacdc59733ca6310d65af83d349360d36ec622363"
};
