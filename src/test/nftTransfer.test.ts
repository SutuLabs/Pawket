import { Instance } from "@/services/util/instance";
import { didAnalysis } from "./cases/nft.test.data";
import { testTransferNft } from "./nftFunctions";

beforeAll(async () => {
  await Instance.init();
})

test('Transfer Nft', async () => { await testTransferNft(0n); });
test('Transfer Nft', async () => { await testTransferNft(7777n); });
test('Transfer Nft', async () => { await testTransferNft(0n, didAnalysis); });
test('Transfer Nft', async () => { await testTransferNft(7776n, didAnalysis); });
