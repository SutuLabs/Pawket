import { Instance } from "@/services/util/instance";
import { testUpdateNft } from "./functions";

beforeAll(async () => {
  await Instance.init();
})

test('Update Nft', async () => {
  await testUpdateNft(0n);
});