import { Instance } from "@/services/util/instance";
import { didAnalysis } from "./nft.test.data";
import { testTransferNft } from "./functions";

beforeAll(async () => {
  await Instance.init();
})

test('Transfer Nft', async () => { await testTransferNft(0n); });
test('Transfer Nft', async () => { await testTransferNft(7777n); });
test('Transfer Nft', async () => { await testTransferNft(0n, didAnalysis); });
test('Transfer Nft', async () => { await testTransferNft(7776n, didAnalysis); });
