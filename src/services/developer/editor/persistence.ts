export interface MixchCodeFilePersistent {
  name?: string;
  code?: string;
}
export interface MixchCodePersistent {
  files?: MixchCodeFilePersistent[];
  selectedIndex?: number;
}

const MIXCH_CODE_KEY = "MIXCH_CODE";

export function retrieve(): MixchCodePersistent {
  const json = localStorage.getItem(MIXCH_CODE_KEY);
  const code = json ? JSON.parse(json) : getDefaultCode();
  return code;
}

export function persistent(info: MixchCodePersistent): void {
  localStorage.setItem(MIXCH_CODE_KEY, JSON.stringify(info));
}

function getDefaultCode(): MixchCodePersistent {
  return {
    files: [
      {
        name: "default.js", code:
          `
// console.log(coins);

const coin = coins[0];
console.log(coin);
const puz = getPuzDetail(coin.puzzle_hash);

const solution = "(() () ())";
const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
const coin_spends = [];
coin_spends.push({ coin, puzzle_reveal, solution: solution_hex })
ex.bundle = {
  aggregated_signature: "",
  coin_spends
};
console.log(ex, coin_spends, ex.bundle);
`.trim(),
      },
      {
        name: "default.clsp",
        code: `(mod (password new_puzhash amount)
  (defconstant CREATE_COIN 51)

  (if (= (sha256 password) (q . 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08))
    (list (list CREATE_COIN new_puzhash amount))
    (x)
  )
)`,
      },
    ]
  };
}