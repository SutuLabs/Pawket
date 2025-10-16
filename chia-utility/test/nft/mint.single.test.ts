import { nftMetadata } from "./nft.test.data";
import { testMintNft } from "./functions";

test("Mint Nft", async () => {
  await testMintNft(0n, nftMetadata);
  await testMintNft(8889n, nftMetadata);
});
