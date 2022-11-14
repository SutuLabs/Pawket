import { Instance } from "@/services/util/instance";
import { nftMetadata } from "./nft.test.data";
import { testMintNft } from "./functions";

beforeAll(async () => {
  await Instance.init();
})

test('Mint Nft', async () => {
  await testMintNft(0n, nftMetadata);
  await testMintNft(8889n, nftMetadata);
});