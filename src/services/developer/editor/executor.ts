import { prefix0x } from "@/services/coin/condition";
import puzzle, { PuzzleDetail } from "@/services/crypto/puzzle";
import { getAccountAddressDetails } from "@/services/util/account";
import { getTestAccount } from "@/test/utility";
import coins from "@/services/developer/coins.json";
import { CoinItem } from "@/models/wallet";

interface ExecuteResultObject {
  result?: unknown[][];
  finish: boolean;
}

export async function executeCode(code: string): Promise<ExecuteResultObject> {
  /* eslint-disable no-useless-escape */
  const text = `<script>
async function __run() { ${code} };
__run()
  .then(()=>{__ex.finish=true;})
  .catch((msg)=>{
    console.error(msg);
    __ex.result?.push(["error", msg.message]);
    __ex.finish=true;
  });
<\/script>`;
  /* eslint-enable no-useless-escape */
  const ifr = document.createElement("iframe");
  ifr.setAttribute("frameborder", "0");
  ifr.setAttribute("id", "iframeResult");
  ifr.setAttribute("name", "iframeResult");
  ifr.setAttribute("allowfullscreen", "false");
  document.body.appendChild(ifr);
  const ifrw = ifr.contentWindow;
  if (!ifrw) throw new Error("Cannot find content window");

  // const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, "txch", "TXCH", undefined, "cat_v2");
  const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign(
    {},
    ...tokenPuzzles.flatMap((_) => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x }))
  );
  const getPuzDetail = (hash: string) => {
    const puz = puzzleDict[hash];
    if (!puz) throw new Error("cannot find puzzle: " + hash);
    return puz;
  };

  const __ex: ExecuteResultObject = { result: [], finish: false };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fw = ifrw as any;

  fw.puzzle = puzzle;
  fw.getPuzDetail = getPuzDetail;
  fw.__ex = __ex;
  fw.prefix0x = prefix0x;
  fw.coins = coins
    .flatMap((_) => _.records)
    .map((_) => _.coin as CoinItem)
    .map((_) => ({
      amount: BigInt(_.amount),
      parent_coin_info: _.parentCoinInfo,
      puzzle_hash: _.puzzleHash,
    }));

  fw.console.log = (function () {
    const log = console.log;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (...args: any[]) {
      __ex.result?.push(args);
      log.apply(console, args);
    }
  })();

  // const ifrw = (ifr.contentWindow) ? ifr.contentWindow
  // : (ifr.contentDocument && ifr.contentDocument.document) ? ifr.contentDocument.document
  //  : ifr.contentDocument;
  ifrw.document.open();
  ifrw.document.write(text);
  ifrw.document.close();

  return await new Promise(resolve => {
    const refresh = function () {
      if (!__ex.finish) {
        setTimeout(() => {
          refresh();
        }, 50);
        return;
      }

      resolve(__ex);
      document.body.removeChild(ifr);
    };

    refresh();
  });
}