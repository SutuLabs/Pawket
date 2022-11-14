import { Instance } from "@/services/util/instance";
import { nftMetadata } from "./nft.test.data";
import { testMintNft } from "./functions";

beforeAll(async () => {
  await Instance.init();
})

const metadatas = [
  Object.assign({}, nftMetadata, { serialNumber: 1 }),
  Object.assign({}, nftMetadata, { serialNumber: 2 }),
  Object.assign({}, nftMetadata, { serialNumber: 3 }),
];
const addresses = [
  "xch1yrp82hk8q566lj9zkpqg637rp4r6rnsjxtxdxdusxrp62ymru2eq3l2ger",
  "xch12kr5c48vs65gugkn448j4djz95xqhxxjm05e0hfp7sze85rvsfns56p70d",
  "xch1mh5us8c296g4rvfhf4ksmnwzd66a9tzt9rslf3f4waejhyws7g6slnrxz6",
]

test('Mint Multiple Nfts', async () => { await testMintNft(0n, metadatas); });
test('Mint Multiple Nfts', async () => { await testMintNft(8888n, metadatas, addresses); });
