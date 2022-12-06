import { analyzeNftCoin } from "@/services/coin/nft";
import { Instance } from "@/services/util/instance";

import nftcoin1 from "../cases/nftcoin1.json"
import nftcoin2 from "../cases/nftcoin2.json"
import nftcoin3 from "../cases/nftcoin3.json"
import nftcoin4 from "../cases/nftcoin4.json"
import nftcoin5 from "../cases/nftcoin5.json"
import nftcoin8 from "../cases/nftcoin8.json"
import nftcoin9 from "../cases/nftcoin9.json"

import cnscoin1 from "../cases/cnscoin1.json"

beforeAll(async () => {
  await Instance.init();
})

async function testAnalyzeNftCoin(coin: any, hintPuzzle: string): Promise<void> {
  const puzzle_reveal = coin.puzzle_reveal;
  const solution = coin.solution;
  const ret = await analyzeNftCoin(puzzle_reveal, hintPuzzle, coin.coin, solution);
  expect(ret).toMatchSnapshot("nft analysis result");
}

// coin: 0x7daa37d920abd727414982a6e62cf79826f3973553dc4f1859fbdf25f4c425e6
test('Analyze Nft 1', async () => await testAnalyzeNftCoin(nftcoin1, "db308b6dcd4cd92a905934bc50d1e66f8788e876abe772c4c2b6bbe71e3b5f6f"));
// coin: 0x51a79ce606902e3b62074bcf43446bae24e3247d74bf1b993c70b78c2d1394c9
test('Analyze Nft 2', async () => await testAnalyzeNftCoin(nftcoin2, "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"));
// mainnet coin: 0x206fd290475e6c54eabc1216eec3f1ef4f8f66c0339fdf9275dd0e31a2ff8c75
test('Analyze Nft 3', async () => await testAnalyzeNftCoin(nftcoin3, "4c61cafe5965913de3655cc6a5015ec196a1cf8fe1652e2951245f4dac9e01c6"));

test('Analyze Nft 4', async () => await testAnalyzeNftCoin(nftcoin4, "0000000000000000000000000000000000000000000000000000000000000000"));
// mainnet coin: 0x092addccb83469b626b4a462e2b8671bb33085032486e9cf6861c43db188516b
test('Analyze Nft 5', async () => await testAnalyzeNftCoin(nftcoin5, "bae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79"));
// with updater: new url
test('Analyze Nft 8', async () => await testAnalyzeNftCoin(nftcoin8, "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"));
// first minted cns nft
test('Analyze Nft 9', async () => await testAnalyzeNftCoin(nftcoin9, "55bf9e6b0fda4c6657e243f97db8845b5a3b854667edd80f5e621a1ed9e648cc"));
// updated updater for cns nft: 0x018ef89d7d5680a23de5ad3b530ebf2461856962a49e2bd02e44ba9c19d4207c
test('Analyze CNS NFT 1', async () => await testAnalyzeNftCoin(cnscoin1, ""));