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
const coin = coins[0];
const puz = getPuzDetail(coin.puzzle_hash);

const solution = "(() () ())";
const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
const coin_spends = [];
coin_spends.push({ coin, puzzle_reveal, solution: solution_hex })
const bundle = {
  aggregated_signature: "",
  coin_spends
};
console.log("output", coin_spends, bundle, 'offer1qqz83wcsltt6wcmqvpsxzgqqt6eygz974zk0y99dt8zz4v8tnzldmryclq5mla6lhmclhmwv3m6gqf5c8fupxm95vgd6mkzx9wmdrzndk33phtwclc84p3gx98wp0x80lww0pt4469udhhxg4qymj3mzr8ts0xx0t5d33denkp4h0rdv2c24gk0w63dclsc7dv2aar4akdz5nfw53v5usfe3yml8qlzc3ltq0auj57wap2szt2mcmns4svc5se5plt8ddpm0v5us2l8hdmw0wmhae054n8rk4swg6xn9hvzjvd2wulxkgqp2fx9tevk097lwghu7hh024zg9q5ewcvuhcjk88ul67ex7vu7xq4tfnahlekxvydjy4qpaj7yflaq5f36wwdzcv3xt5d6jw7nnr2d28j6lumtk2m5er25meaklkd44m202q7tskmrd3nv9jk8q7jw0hkrzp67j84eu2kh0e8t4aw7u8d58rnqxdj5t90jeur3gdk27r0x5p3k0pph9waaj6e48fml8tvnsaxq78l7jlhjql9lv6ljm79d52d0wau9td4evypgv8xfhv0l7v2exs3vc39su7jt0krtqvj9zl6lkp4erc7j0w77rlgalw4yekr84sfkcldqk9hkwculn92709k405wdlhle87xlrck24uzsvp4sdtuuck7lmdyafprdtr4phg8w93ehj58g98xstn5jnn9stg79zk0neelemlffsggt2f4hxl7pdq7hllr0rxpg24hk84r8t9gvach4yprh708wqhf9tuuhx3xlfppfnsz4wele0jr3esh0p2vh05sl7sprdl49g3snmne6zhsj8n49cz0lv6uveyz5l7yqu5fa67mzsfuajjka5urexf46nr956ms2hy2fvxfr5h0x90ljfnh77f792z79uunaejyf87l99lxcue7ycc7wfkeuc8qwet9ha5rrhkdus7arl2ptsetyxqeccvy5kxjkl5ar7k2a0tqkkukdkln66asrereya08u6shwn29umlarhu57dj6ry8wewaj6d7e6cwfn7h09krychaejg98pldluzsfhxltft59h3gqmwr0lxfk79apnjz2ecxa98ven0nz0lycll323j5cqln957hx3khstu7l4rn7f0r64gageuhz8ecgadwcshwdj6f8ggaxtxx46ux9jcz6tmsw6vlvertnd37e7t5kkanswczfsk75xh68ll4s9xgkr5qlvtcfpk7r5vkzvxjk9k7u4h89ugs676wur6g9pgf765jyknkf36s4k9nlnamklvceflty8aertc4y40x3rr722h6xmwe573gs6xejkrzynrh24kk7h42e3el7gje7awwdax93y3fk6n9trl3hrxc7398ttmah2watphfkdrs6cdu7r4jndf0y0y92jh677ahhryhew23emf354lhr6c57ecc8gf9d8f2zd9yaylmrntkg7rwmtfn8h7cyetl9m94hwaw6jsgq9a2uctqkhhd00');
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