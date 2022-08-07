import { GetParentPuzzleResponse } from "@/models/api";
import { getTestAccount } from "./utility";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { getOfferSummary } from "@/services/offer/summary";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";
import { combineSpendBundle, generateNftOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";

function xchPrefix() { return "txch"; }
function xchSymbol() { return "TXCH"; }
function chainId() { return "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2"; }

beforeAll(async () => {
  await Instance.init();
})

test('create and accept nft offer for xch', async () => {

  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const nft = {
    "metadata": {
      "uri": "https://guggero.github.io/cryptography-toolkit/images/fork-me-on-github-ribbon.png",
      "hash": "e62bcdc91903b07b7b86f1af11c5fdd9c3b545bfff90515976f9e8d67c91eb0f",
      "name": "ChiaZavr #3"
    },
    "hintPuzzle": "0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155",
    "address": "nft1wnx8ukgyxyz80whxufgfzrdflmswvp9e84e6rqxt6pfdzt6kw6dqsrd9vm",
    "coin": {
      "amount": 1n,
      "parent_coin_info": "0x81f9e36a5e45fe43b590eedb39db8fba322077885d9044d31378219ec988e8a0",
      "puzzle_hash": "0x311524ea04195c124d0fa3cebc7c7118b99eaa2553284d7be4820cc52f6ce1c9"
    },
    "analysis": {
      "metadata": {
        "imageUri": "https://guggero.github.io/cryptography-toolkit/images/fork-me-on-github-ribbon.png",
        "imageHash": "e62bcdc91903b07b7b86f1af11c5fdd9c3b545bfff90515976f9e8d67c91eb0f",
        "metadataUri": "https://ufzyuv55yicm3ev56cstqbmaayrkudmmjueyrd3nkolafxbe.arweave.net/oX--OKV73CBM2-SvfClOAWABiKqDYxNCYiPbVOWAtwk",
        "metadataHash": "44475cb971933e4545efad1337f3d68bc53523d987412df233f3b905ed1c5b3f",
        "licenseUri": "https://bafybeigzcazxeu7epmm4vtkuadrvysv74lbzzbl2evphtae6k57yhgynp4.ipfs.nftstorage.link/license.pdf",
        "licenseHash": "2267456bd2cef8ebc2f22a42947b068bc3b138284a587feda2edfe07a3577f50",
        "serialNumber": "08",
        "serialTotal": "05"
      },
      "rawMetadata": "((117 \"https://guggero.github.io/cryptography-toolkit/images/fork-me-on-github-ribbon.png\") (104 . 0xe62bcdc91903b07b7b86f1af11c5fdd9c3b545bfff90515976f9e8d67c91eb0f) (28021 \"https://ufzyuv55yicm3ev56cstqbmaayrkudmmjueyrd3nkolafxbe.arweave.net/oX--OKV73CBM2-SvfClOAWABiKqDYxNCYiPbVOWAtwk\") (27765 \"https://bafybeigzcazxeu7epmm4vtkuadrvysv74lbzzbl2evphtae6k57yhgynp4.ipfs.nftstorage.link/license.pdf\") (29550 . 8) (29556 . 5) (28008 . 0x44475cb971933e4545efad1337f3d68bc53523d987412df233f3b905ed1c5b3f) (27752 . 0x2267456bd2cef8ebc2f22a42947b068bc3b138284a587feda2edfe07a3577f50))",
      "singletonModHash": "0x7faa3253bfddd1e0decb0906b2dc6247bbc4cf608f58345d173adb63e8b47c9f",
      "launcherId": "0x74cc7e5904310477bae6e250910da9fee0e604b93d73a180cbd052d12f56769a",
      "launcherPuzzleHash": "0xeff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9",
      "nftStateModHash": "0xa04d9f57764f54a43e4030befb4d80026e870519aaa66334aef8304f5d0393c2",
      "metadataUpdaterPuzzleHash": "0xfe8a4b4e27a2e29a4d3fc7ce9d527adbcaccbab6ada3903ccf3ba9a769d2d78b",
      "p2InnerPuzzle": "(a (q 2 10 (c 2 (c 3 ()))) (c (q (51 . 62) (a (i 5 (q 4 (c 12 (c (a 30 (c 2 (c 9 ()))) ())) (a 22 (c 2 (c 25 (c (a 10 (c 2 (c 13 ()))) ()))))) ()) 1) (a (i 5 (q 4 (c 8 9) (a 22 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))",
      "nftOwnershipModHash": "0xc5abea79afaa001b5427dfa0c8cf42ca6f38f5841b78f9b3c252733eb2de2726",
      "previousOwner": "()",
      "didOwner": "()",
      "p2Owner": "",
      "royaltyAddress": "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e",
      "tradePricePercentage": 800,
      "hintPuzzle": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
    }
  };
  const offs = [
    {
      "id": "74cc7e5904310477bae6e250910da9fee0e604b93d73a180cbd052d12f56769a",
      "amount": 1n,
      "target": "",
      "nft_target": "",
      "royalty": 800,
      "nft_uri": "https://guggero.github.io/cryptography-toolkit/images/fork-me-on-github-ribbon.png"
    }
  ];
  const reqs = [
    {
      "id": "",
      "symbol": "TXCH",
      "amount": 200n,
      "target": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
    }
  ];

  const nonce = "626f9cf141deefc2e77a56a4ef99996259e840dc4020eda31408cdd442a770d1"
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const availcoins = {
    "TXCH": [
      {
        "amount": 4998981617n,
        "parent_coin_info": "0x04a7b8ec1b6fb7d9c34ad973af248980f80e578142670a9356d7790fa9f550b0",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
      {
        "amount": 200n,
        "parent_coin_info": "0x46f951c709f81aca66e12d744b36f220ac89bc171338ec9fe8c012eb76d5266c",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ],
  };

  const offplan = await generateOfferPlan(offs, change_hex, availcoins, 0n, xchSymbol());
  expect(offplan).toMatchSnapshot("offplan");
  const bundle = await generateNftOffer(
    offplan,
    nft.analysis,
    nft.coin,
    reqs,
    tokenPuzzles,
    localPuzzleApiCall,
    xchSymbol(),
    chainId(),
    nonce
  );
  expect(bundle).toMatchSnapshot("bundle");
  const offerText = await encodeOffer(bundle);
  expect(offerText).toMatchSnapshot("offer text");

  const makerBundle = await decodeOffer(offerText);
  expect(makerBundle).toStrictEqual(bundle);

  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const revSummary = getReversePlan(summary, change_hex, {});
  expect(revSummary).toMatchSnapshot("revSummary");
  const fee = 0n;
  expect(fee).toMatchSnapshot("fee");

  // royalty_amount = uint64(offered_amount * royalty_percentage / 10000)
  const royalty_amount = (revSummary.offered[0].amount * BigInt(nft.analysis.tradePricePercentage)) / BigInt(10000);
  expect(royalty_amount).toMatchSnapshot("royalty_amount");
  const offplangen = await generateOfferPlan(
    revSummary.offered,
    change_hex,
    availcoins,
    fee,
    xchSymbol(),
    royalty_amount
  );
  expect(offplangen).toMatchSnapshot("offplangen");
  const takerBundle = await generateNftOffer(
    offplangen,
    nft.analysis,
    undefined,
    revSummary.requested,
    tokenPuzzles,
    localPuzzleApiCall,
    xchSymbol(),
    chainId(),
    nonce
  );
  expect(takerBundle).toMatchSnapshot("takerBundle");
  const combined = await combineSpendBundle([makerBundle, takerBundle]);
  expect(combined).toMatchSnapshot("combined");
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const knownCoins: GetParentPuzzleResponse[] = [
    {
      "parentCoinId": "0x81f9e36a5e45fe43b590eedb39db8fba322077885d9044d31378219ec988e8a0",
      "amount": 1,
      "parentParentCoinId": "0x8018d81414acec1b72cb8b5d54a5aec4959bda8b7d07394812cd71f75c1b9235",
      "puzzleReveal": "0xff02ffff01ff02ffff01ff02ffff03ffff18ff2fff3480ffff01ff04ffff04ff20ffff04ff2fff808080ffff04ffff02ff3effff04ff02ffff04ff05ffff04ffff02ff2affff04ff02ffff04ff27ffff04ffff02ffff03ff77ffff01ff02ff36ffff04ff02ffff04ff09ffff04ff57ffff04ffff02ff2effff04ff02ffff04ff05ff80808080ff808080808080ffff011d80ff0180ffff04ffff02ffff03ff77ffff0181b7ffff015780ff0180ff808080808080ffff04ff77ff808080808080ffff02ff3affff04ff02ffff04ff05ffff04ffff02ff0bff5f80ffff01ff8080808080808080ffff01ff088080ff0180ffff04ffff01ffffffff4947ff0233ffff0401ff0102ffffff20ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff3cffff0bff34ff2480ffff0bff3cffff0bff3cffff0bff34ff2c80ff0980ffff0bff3cff0bffff0bff34ff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ffff22ffff09ffff0dff0580ff2280ffff09ffff0dff0b80ff2280ffff15ff17ffff0181ff8080ffff01ff0bff05ff0bff1780ffff01ff088080ff0180ff02ffff03ff0bffff01ff02ffff03ffff02ff26ffff04ff02ffff04ff13ff80808080ffff01ff02ffff03ffff20ff1780ffff01ff02ffff03ffff09ff81b3ffff01818f80ffff01ff02ff3affff04ff02ffff04ff05ffff04ff1bffff04ff34ff808080808080ffff01ff04ffff04ff23ffff04ffff02ff36ffff04ff02ffff04ff09ffff04ff53ffff04ffff02ff2effff04ff02ffff04ff05ff80808080ff808080808080ff738080ffff02ff3affff04ff02ffff04ff05ffff04ff1bffff04ff34ff8080808080808080ff0180ffff01ff088080ff0180ffff01ff04ff13ffff02ff3affff04ff02ffff04ff05ffff04ff1bffff04ff17ff8080808080808080ff0180ffff01ff02ffff03ff17ff80ffff01ff088080ff018080ff0180ffffff02ffff03ffff09ff09ff3880ffff01ff02ffff03ffff18ff2dffff010180ffff01ff0101ff8080ff0180ff8080ff0180ff0bff3cffff0bff34ff2880ffff0bff3cffff0bff3cffff0bff34ff2c80ff0580ffff0bff3cffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff34ff3480ff8080808080ffff0bff34ff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff02ffff03ffff21ff17ffff09ff0bff158080ffff01ff04ff30ffff04ff0bff808080ffff01ff088080ff0180ff018080ffff04ffff01ffa07faa3253bfddd1e0decb0906b2dc6247bbc4cf608f58345d173adb63e8b47c9fffa074cc7e5904310477bae6e250910da9fee0e604b93d73a180cbd052d12f56769aa0eff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9ffff04ffff01ff02ffff01ff02ffff01ff02ff3effff04ff02ffff04ff05ffff04ffff02ff2fff5f80ffff04ff80ffff04ffff04ffff04ff0bffff04ff17ff808080ffff01ff808080ffff01ff8080808080808080ffff04ffff01ffffff0233ff04ff0101ffff02ff02ffff03ff05ffff01ff02ff1affff04ff02ffff04ff0dffff04ffff0bff12ffff0bff2cff1480ffff0bff12ffff0bff12ffff0bff2cff3c80ff0980ffff0bff12ff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff0bff12ffff0bff2cff1080ffff0bff12ffff0bff12ffff0bff2cff3c80ff0580ffff0bff12ffff02ff1affff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff02ffff03ff0bffff01ff02ffff03ffff09ff23ff1880ffff01ff02ffff03ffff18ff81b3ff2c80ffff01ff02ffff03ffff20ff1780ffff01ff02ff3effff04ff02ffff04ff05ffff04ff1bffff04ff33ffff04ff2fffff04ff5fff8080808080808080ffff01ff088080ff0180ffff01ff04ff13ffff02ff3effff04ff02ffff04ff05ffff04ff1bffff04ff17ffff04ff2fffff04ff5fff80808080808080808080ff0180ffff01ff02ffff03ffff09ff23ffff0181e880ffff01ff02ff3effff04ff02ffff04ff05ffff04ff1bffff04ff17ffff04ffff02ffff03ffff22ffff09ffff02ff2effff04ff02ffff04ff53ff80808080ff82014f80ffff20ff5f8080ffff01ff02ff53ffff04ff818fffff04ff82014fffff04ff81b3ff8080808080ffff01ff088080ff0180ffff04ff2cff8080808080808080ffff01ff04ff13ffff02ff3effff04ff02ffff04ff05ffff04ff1bffff04ff17ffff04ff2fffff04ff5fff80808080808080808080ff018080ff0180ffff01ff04ffff04ff18ffff04ffff02ff16ffff04ff02ffff04ff05ffff04ff27ffff04ffff0bff2cff82014f80ffff04ffff02ff2effff04ff02ffff04ff818fff80808080ffff04ffff0bff2cff0580ff8080808080808080ff378080ff81af8080ff0180ff018080ffff04ffff01a0a04d9f57764f54a43e4030befb4d80026e870519aaa66334aef8304f5d0393c2ffff04ffff01ffff75ffc05268747470733a2f2f6775676765726f2e6769746875622e696f2f63727970746f6772617068792d746f6f6c6b69742f696d616765732f666f726b2d6d652d6f6e2d6769746875622d726962626f6e2e706e6780ffff68a0e62bcdc91903b07b7b86f1af11c5fdd9c3b545bfff90515976f9e8d67c91eb0fffff826d75ffc07068747470733a2f2f75667a79757635357969636d336576353663737471626d616179726b75646d6d6a7565797264336e6b6f6c61667862652e617277656176652e6e65742f6f582d2d4f4b56373343424d322d537666436c4f41574142694b714459784e4359695062564f574174776b80ffff826c75ffc06468747470733a2f2f62616679626569677a63617a7865753765706d6d3476746b756164727679737637346c627a7a626c3265767068746165366b3537796867796e70342e697066732e6e667473746f726167652e6c696e6b2f6c6963656e73652e70646680ffff82736e08ffff82737405ffff826d68a044475cb971933e4545efad1337f3d68bc53523d987412df233f3b905ed1c5b3fffff826c68a02267456bd2cef8ebc2f22a42947b068bc3b138284a587feda2edfe07a3577f5080ffff04ffff01a0fe8a4b4e27a2e29a4d3fc7ce9d527adbcaccbab6ada3903ccf3ba9a769d2d78bffff04ffff01ff02ffff01ff02ffff01ff02ff26ffff04ff02ffff04ff05ffff04ff17ffff04ff0bffff04ffff02ff2fff5f80ff80808080808080ffff04ffff01ffffff82ad4cff0233ffff3e04ff81f601ffffff0102ffff02ffff03ff05ffff01ff02ff2affff04ff02ffff04ff0dffff04ffff0bff32ffff0bff3cff3480ffff0bff32ffff0bff32ffff0bff3cff2280ff0980ffff0bff32ff0bffff0bff3cff8080808080ff8080808080ffff010b80ff0180ff04ffff04ff38ffff04ffff02ff36ffff04ff02ffff04ff05ffff04ff27ffff04ffff02ff2effff04ff02ffff04ffff02ffff03ff81afffff0181afffff010b80ff0180ff80808080ffff04ffff0bff3cff4f80ffff04ffff0bff3cff0580ff8080808080808080ff378080ff82016f80ffffff02ff3effff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff2fffff01ff80ff808080808080808080ff0bff32ffff0bff3cff2880ffff0bff32ffff0bff32ffff0bff3cff2280ff0580ffff0bff32ffff02ff2affff04ff02ffff04ff07ffff04ffff0bff3cff3c80ff8080808080ffff0bff3cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff02ffff03ff5fffff01ff02ffff03ffff09ff82011fff3880ffff01ff02ffff03ffff09ffff18ff82059f80ff3c80ffff01ff02ffff03ffff20ff81bf80ffff01ff02ff3effff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff81dfffff04ff82019fffff04ff82017fff80808080808080808080ffff01ff088080ff0180ffff01ff04ff819fffff02ff3effff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff81dfffff04ff81bfffff04ff82017fff808080808080808080808080ff0180ffff01ff02ffff03ffff09ff82011fff2c80ffff01ff02ffff03ffff20ff82017f80ffff01ff04ffff04ff24ffff04ffff0eff10ffff02ff2effff04ff02ffff04ff82019fff8080808080ff808080ffff02ff3effff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff81dfffff04ff81bfffff04ffff02ff0bffff04ff17ffff04ff2fffff04ff82019fff8080808080ff8080808080808080808080ffff01ff088080ff0180ffff01ff02ffff03ffff09ff82011fff2480ffff01ff02ffff03ffff20ffff02ffff03ffff09ffff0122ffff0dff82029f8080ffff01ff02ffff03ffff09ffff0cff82029fff80ffff010280ff1080ffff01ff0101ff8080ff0180ff8080ff018080ffff01ff04ff819fffff02ff3effff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff81dfffff04ff81bfffff04ff82017fff8080808080808080808080ffff01ff088080ff0180ffff01ff04ff819fffff02ff3effff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff81dfffff04ff81bfffff04ff82017fff808080808080808080808080ff018080ff018080ff0180ffff01ff02ff3affff04ff02ffff04ff05ffff04ff0bffff04ff81bfffff04ffff02ffff03ff82017fffff0182017fffff01ff02ff0bffff04ff17ffff04ff2fffff01ff808080808080ff0180ff8080808080808080ff0180ff018080ffff04ffff01a0c5abea79afaa001b5427dfa0c8cf42ca6f38f5841b78f9b3c252733eb2de2726ffff04ffff0180ffff04ffff01ff02ffff01ff02ffff01ff02ffff03ff81bfffff01ff04ff82013fffff04ff80ffff04ffff02ffff03ffff22ff82013fffff20ffff09ff82013fff2f808080ffff01ff04ffff04ff10ffff04ffff0bffff02ff2effff04ff02ffff04ff09ffff04ff8205bfffff04ffff02ff3effff04ff02ffff04ffff04ff09ffff04ff82013fff1d8080ff80808080ff808080808080ff1580ff808080ffff02ff16ffff04ff02ffff04ff0bffff04ff17ffff04ff8202bfffff04ff15ff8080808080808080ffff01ff02ff16ffff04ff02ffff04ff0bffff04ff17ffff04ff8202bfffff04ff15ff8080808080808080ff0180ff80808080ffff01ff04ff2fffff01ff80ff80808080ff0180ffff04ffff01ffffff3f02ff04ff0101ffff822710ff02ff02ffff03ff05ffff01ff02ff3affff04ff02ffff04ff0dffff04ffff0bff2affff0bff2cff1480ffff0bff2affff0bff2affff0bff2cff3c80ff0980ffff0bff2aff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ff17ffff01ff04ffff04ff10ffff04ffff0bff81a7ffff02ff3effff04ff02ffff04ffff04ff2fffff04ffff04ff05ffff04ffff05ffff14ffff12ff47ff0b80ff128080ffff04ffff04ff05ff8080ff80808080ff808080ff8080808080ff808080ffff02ff16ffff04ff02ffff04ff05ffff04ff0bffff04ff37ffff04ff2fff8080808080808080ff8080ff0180ffff0bff2affff0bff2cff1880ffff0bff2affff0bff2affff0bff2cff3c80ff0580ffff0bff2affff02ff3affff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff3effff04ff02ffff04ff09ff80808080ffff02ff3effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01ffa07faa3253bfddd1e0decb0906b2dc6247bbc4cf608f58345d173adb63e8b47c9fffa074cc7e5904310477bae6e250910da9fee0e604b93d73a180cbd052d12f56769aa0eff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9ffff04ffff01a05662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3effff04ffff01820320ff0180808080ffff04ffff01ff02ffff01ff02ff0affff04ff02ffff04ff03ff80808080ffff04ffff01ffff333effff02ffff03ff05ffff01ff04ffff04ff0cffff04ffff02ff1effff04ff02ffff04ff09ff80808080ff808080ffff02ff16ffff04ff02ffff04ff19ffff04ffff02ff0affff04ff02ffff04ff0dff80808080ff808080808080ff8080ff0180ffff02ffff03ff05ffff01ff04ffff04ff08ff0980ffff02ff16ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff1effff04ff02ffff04ff09ff80808080ffff02ff1effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ff018080808080ff018080808080ff01808080"
    },
  ];
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}


test('create and accept xch offer for nft', async () => {
  //
});