import { GetParentPuzzleResponse } from "@/models/api";
import { getTestAccount } from "../utility";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { getOfferSummary, OfferEntity } from "@/services/offer/summary";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";
import { combineOfferSpendBundle, generateNftOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { SymbolCoins } from "@/services/transfer/transfer";
import { NftDetail } from "@/services/crypto/receive";
import { NetworkContext } from "@/services/coin/coinUtility";
import { assertSpendbundle } from "@/services/spendbundle/validator";
import { signSpendBundle } from "@/services/spendbundle";
import { knownCoins } from "./nft.test.data";
import { analyzeNftCoin } from "@/services/coin/nft";

const tnet: NetworkContext = {
  prefix: "txch",
  symbol: "TXCH",
  chainId: "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2",
  api: localPuzzleApiCall,
}
const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
}

beforeAll(async () => {
  await Instance.init();
})

test('create and accept nft offer for xch', async () => {

  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const nft: NftDetail = {
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
      "coin": {
        "amount": 1n,
        "parent_coin_info": "0x81f9e36a5e45fe43b590eedb39db8fba322077885d9044d31378219ec988e8a0",
        "puzzle_hash": "0x311524ea04195c124d0fa3cebc7c7118b99eaa2553284d7be4820cc52f6ce1c9"
      },
      "hintPuzzle": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
    }
  };
  const offs: OfferEntity[] = [
    {
      "id": "74cc7e5904310477bae6e250910da9fee0e604b93d73a180cbd052d12f56769a",
      "amount": 0n,
      "royalty": 800,
      "nft_uri": "https://guggero.github.io/cryptography-toolkit/images/fork-me-on-github-ribbon.png"
    }
  ];
  const reqs: OfferEntity[] = [
    {
      "id": "",
      "symbol": "TXCH",
      "amount": 200n,
      "target": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
    }
  ];

  const nonce = "626f9cf141deefc2e77a56a4ef99996259e840dc4020eda31408cdd442a770d1"
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, tnet.prefix, tnet.symbol, undefined, "cat_v2");
  const availcoins: SymbolCoins = {
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

  const offplan = await generateOfferPlan(offs, change_hex, availcoins, 0n, tnet.symbol);
  expect(offplan).toMatchSnapshot("offplan");
  const ubundle = await generateNftOffer(
    offplan,
    nft.analysis,
    nft.coin,
    reqs,
    tokenPuzzles,
    tnet,
    nonce
  );
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, tnet.chainId);
  expect(bundle).toMatchSnapshot("bundle");
  const offerText = await encodeOffer(bundle, 4);
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
    tnet.symbol,
    royalty_amount
  );
  expect(offplangen).toMatchSnapshot("offplangen");
  const utakerBundle = await generateNftOffer(
    offplangen,
    nft.analysis,
    undefined,
    revSummary.requested,
    tokenPuzzles,
    tnet,
    nonce
  );
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, tnet.chainId);
  expect(takerBundle).toMatchSnapshot("takerBundle");
  const combined = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(combined, tnet.chainId);
  expect(combined).toMatchSnapshot("combined");
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}

test('create and accept xch offer for nft', async () => {
  //
});

test('Nft Offer Encoding', async () => {
  const offerText = "offer1qqph3wlykhv8jcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafsyjlm5pqpj3d5qlw5ahcth6kx0ngg9f86uv020an49fvs6ck6txnv0rln9agqcwdury5yf6tln2sga05j39pecf6v7e4the24umkerjl6z2ew0t83u33hd8648hl4hx2whdtrqyppztjqa48nzy2npkwn5ukghhald6sh0ewnlkv4ukmvnk4qxa58e6yymhrme38tmevzjxdsejejnjh6kxwerj937t95t06mgm43sdut9aam54un9d3vs8r29geuqjd36qcen5p5r9r3llruwcyxvzvgcfrd9u59leg583l7a3v87a80xvndhgf7f0hmerucfl5gjdv0z26mexhmv4xvl7lupmmtwyyuh6a60en4h2jd0rt8jm7ju680383wa246t9td69a08l6c4l00qlkr4yfw0szzqx6wl72xav8z6tenk246uwk48hhvj309le95u845tkyn2z4ewzvf67fpekpps8terxlz80mqqjlkpqt0lnct9lcs5hmqupnm0mandvr9xkeu4tj6jektym58s8l6cumycwc8e5t60lqwy3jff9qnz9d7lm095jt3f9l9zcn69f0vuej7xelwvs26x9ldycj6v4fx5esjd8t9vcf6dxm9n52xv4erv50wwfa9vej9tc49nq23n9yav52efcgnn5we0e3xja3kw8gsj60f0f09ynjk9ylgrqd9jl0vzh362pgejzc7td5fl59mwmu98ugsptlw7nlvljtdmvlv2l8mmunggle8dwt8mlpl3qydlnw2q6ujdr434t8zlj72quuqthpllp7jvptyzn2d9s4y6daffc42ej9gea8zljeteuhyun62er9nztfdfv4r2tjgxxenzn6f475vjvf4fu52un9sed9vet9wxfgs8w2tpawjmwvefx5ln3ffl2zjj6fqfv908sxarp3f9yqerwcupj2fmm3532js3kam7fe8djtpm29wxpujvs739w8pwx092kx47400tjznjtmrqy9d7npy596lna2n0n88akke26u7knshext3hzelf3m8m4ueya5eclctjefhlw4ulh2f00g6vh4l7lzumjs24ka8emkd4dhk7yzfku7k4wtk0h36t6x6tkyar525gjfa5v3c9gars2zdcull732pqk8c5f863g9ydjam57k4u4adtrzjy84809uu8rhhf2jlvt4ckax9flxc0q52akmd657hqv4dkh0mx0dj0ttkgtayhtltf6tlk835f228fy3kaf9az03tun4tc3akre93zwf60gmt573ks3r97g83c5lkakvzull5lt0a5ye7x4hhr88wt628w58ks9y6l55nqa249m7ljv2dxslq85svsrnxsvaqvaqemzqkkkrwm7kcxpqehdnn27hnmfnylg47km0y470lwhwtth46nakw5ssruv04eue2lntm3679gnstkwmrum3l0nveva6l46wgnvfs62esr9t6e7u9vl40upkkl7az888ktmx4uw8g2z0kfyde553ng4u2axs6px9nee3f8utazrlkr95xcznvvrs8xrwyqzxcht3qxseqkjg2cp0fusg4yrpsnv0w8l7llpdez0v8587tkkapa4gsv9y8a5xse23vq7xk9m4uyj4rh4afx3dtswfwrwtk84w6w462282tkzuk20fzhe4a8h65h79nmrkwt466qd9rvf0aufv007r5eu5h4ek8dmjwhu6dqg7w4z6hw8uva0h7gfuuzmzj5ek4weeey2rcvph0yatljdslmyh8kk8vd77v3pwxwljxa0ty7mctm00xmxatwsxxjjqrr2s9t553343a";
  const bundle = await decodeOffer(offerText);
  const summary = await getOfferSummary(bundle);

  expect(summary).toMatchSnapshot("summary");
  expect(bundle).toMatchSnapshot("bundle");

  const encoded = await encodeOffer(bundle, 3);

  expect(encoded).toBe(offerText);
});

test('Accept NFT offer with 0 royalty generated by official client', async () => {
  await acceptOffer(0n, "offer1qqzh3wcuu2rykcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpagr90qq0a37v8lc942d4ufv4atletts27y7jey2kyw6jcjmehlm0rqmkmlntktyeznjqmt8kza7r0nyck4s0utqxa77vqhp33c0uvh9lnm7tkuu4l7m9a774ld7c4fmul6msd43w6pssqk7r9ac0tce77d5j79pc5jh2jep08an9mwhswltsn97x3k4st0um7t5fkuja6tn0cgtcw0mzftsrsazzwfgky4k9ha8yrde7nc0fdan0ka67apvsdrfrgevzgggdajx5apuvf6rlc8uapcvc95epjz6tmgr7j4glpl4mzu0acw7dexmwjn5jl0hz8ecnlg35cck944hz007c2gelllczkxl3enn0ck0dkm0s48fnjt8fjwmje5n6l7j08rk8j5m70fx0d9e44vlqlkr4yfw0szzqx6wl72xav8z6tenk246uwk48hhvj309le95u845tkyn2z4ewzvf6p9pekpps8gynxlp8v8qqjlkpqt0lnct9lcs5hmqupnm0mandvr9xkeu4tj6jektym58s8l6cumycwc8e5t60lqw23jff9qnz9d7lm095jt3f9l9zcn69f0vuej7xelwvs26x9ldycj6v4fx5enz2fqsv5wk2924z6t6wgunn7v62xy4r529z95mvyvea8mxu3twygccnk0kpfvu2jsf2xzhnzj3afz4y6gxpxlwlljk8c4frqwmufgku6s3zqgevhu6rjq7vxgmd227gf0lh7gqevsraq6j6mgpqey5vq44ja46tkkdjuv6h6sgemthtl44ldepyrxtjpm5k9x9c4dpjda0tul0tlll6vhrqtp2q6nzcvs270ela87gy967qqpvsxrqdeqc825m3re5gevacq3zwve3v3zajqaj4wm8zee6sndmxd6d9ejhu82a92maa4hv69euuchds5leggwfvvh77huhk2d0lg6yk4l7lzumnsw4xa8e6kd4ahkk9zdkvuka0tj08n6t6x7txylr5gggztduwfcygunsgzfcvll73p9qk9cuf8cfc9y9jal5w54u4adtnzjy84r047u8zhnf6jlyt4ukay9flxu0s524kmd6y7hgd5gx9dr4pwkp5wf7kgcnavphacnd87wnh7ut8ewt80plxhf0nsnvqmgk8f48uuzvt0720q7xlu3r428rpyhfmakr6lkpx222x3zfmzedvvxaazptv7zrgae5df0jmy7f8avd8smnl264jtve2kftj9vem56ew5mxkcv3hnhy897h77d90l2k6q85n8f0ehpe3uqr6cnrvgzjluyuwk0lske4k8ulk9w0hvtvlhwte7twh57aynm6xuzc0lm89jxgjlqm8myh5q4tmpj6qydwkqpcrrdnjqpnvp3csrg23t3yyvq8kryy65pqef6x8rlldluhlsa0kuj92v4a0kezr360557nqdl903tvzktmh0p3vtzh4zg0agn0e8lq0966kd7tpjwnlnla0zz7d2ua6fmfvk888dg5gfrryvsd392h6taf89s8unxmdhdczv09hyvc625aa0x80ky577khcyxnlhwzve8dnv70qfladn5fzadfww7apu3vgc3xhxtke4jahdewkhv07chy94eljl0fp4d58qwgqqrwut79w6fkhqg");
});
test('Accept NFT offer with 0 royalty generated by Pawket', async () => {
  await acceptOffer(0n, "offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmzpanj8tg3nrkld7u87a8y9a32m0zgdlujwgrlleme8ywwpa7nyks7s2wn0g8wutptx0wmnpe39fhfvhe8w434h6f6e7rcagdcmn9775nc7awt7wq3rjnssgyw2gz88syacl2mza97mwemruhh03hxw6jem4hfl499rl2hjatl6rys6qud50vallqlmwt39l2502a7400rxwffayaw74j55yem9da8scju3e5a30vqcr2zceurx7n5ygq87wmx7s3xqapzvpl6p8cgsqjwmp049wxg9a7lhhuwphhfecmymacjtnme7wgl2z07zy3tde6nk729j6d0nluhlq9daw36789khsy93aa3790wvaw9yhglrrxfedt4cz9fmladzv8p6v6cwplv82gjulqyyqd5alu5d6cw95hn8v4t4cad200we9z7tljtfc0tghvfx59tjuycn4l2qnvzrqwhaxp72w87qp9lvzqkll8sktl3pf0kpcr8klhmx6cx2ddne2h949nvkfhg0q0l43ekfsas0ngh5luq70ryjj2pxy2malhxg9drzhhx8cv9dr7vfkehztr5eykhwz3wwn6zcnp2kj6hya3n4j8rwvyt9uctvt3gwrmjnr3s39yqcrjtw9e2muc8tgdnrs83w4ae834ahefevhu6v03mhut4chk3xyyfc986umrm78e5z5phumkwq0ey4xts7lwfvh2nu7d9lehyjj2ws8u4u7ffnegnu3nwg6t0umn9qyjuukg759ymah5pexueac2fm9hwrrfqxvefvmz2elcmearsecc8tlrmm7x8ukh80d908878fu6juv4uc8u2k59s0qdaq4gw2prffxqdexykn92f4yv7n4wfp82e22f9u65ctwfe5mjj2kf93x5u2eg4ghj7vf4ef9242jfegc5ktpgey5yjnekeymnftx0fzhuc2fn6vptkdfv4jjtkf9a9ycn74e0yuej7kely5cnkd9d8d226gfypnj2f8vwq49wnt76jhx067rla2fef55kd2m7lsgc9smtugl2mchhh7vd03chslqp29t8q8rftzktnfvfycy3whhuhx70l4gk8kd7w6rulnwdagatm2jvamk6k460xpu670tjh9nxt6uamr9yd50euh2zevp68u6t50cysp7l7pl82lygmfa6pnhuzzn7uw4el9twt7zkphfz86l5zj0n3mnh9t07x6yfwlzuln5xsx9w6d7l2dtgx24svtc6huycc2vlmg4zak4vlm7xs4x6ghmmhdhfdlepu4tj6uah2nwwd3zjg68uec50enssmprmnnl80mtq9l3d3tmj2gelchn8semdz3x7j997hett4k6zh4wyalt79yrh0wcygvs55qxwcwac7tfrp4dnm4tqqdmccwjwzn4444eza4jrd0duyrwl3cfl8cwfhk6r5evzmzfs7mjxc7nm6lh9m6auakvlu7v94l7j0lp77eddv43xwesp906fcuvll3wnpmlhvn4uljxhkst0ztpvnrlh4p2ydemwyk999ra5t7n8mlj3dtu77s0wcvxj7qga3skrcsdjhxuqc3mcllpvyqmtyzwsg9gpx0t6d5x86d70kak0adgvh9k2zuyfd9ahrmw7rzggmn6wu5ee5yfv7m8rslmgalhh4w0lwsdz0h92kqhclc3kzmvl0xux07zua5xla0wf9tvp4shlvzmyla7l864x6lhxnju8wf0pd03na3awwa962lktxvtq048fx3tvxqpx4dc54s7rnwgs");
});
test('Accept NFT offer with fee reserved', async () => {
  await acceptOffer(0n, "offer1qqzh3wcuu2rykcmqvpsxzgqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpagr90qq0a37v8lc9xm9z4euzhztlxthly6gtnukjd0rtwhu0egye7767vh0rseuzgm6l0r6qykecuma5pj5t2w9t09vrj0d0c93dtjnrtlxql7jmzkkd5gy37xvumngdmnyq2kd360y65all3h0ahzurzk6k0eyxakyeevlu7fwavzgxtukhjylt5czhyjuy9xhddvn8mh2vayt59kaxu34wc73sxcddsk4jddchfhgttx4kuvhrfqscvyccgd92xuapwv36zle87apwvsyvap2q6tmg97j4gmqlhm6703cw7dp8mwnrkj0whw8ecnlg3ucgj9dhh2wlccjteh707zlxr2w8lwnm32st36k0a2ms72ld0xfulflgw3wz5r93m2d8q3m00dcv9qhhra9f20qrzg82glwtxad8x6renk246uw448h82jew9me4kuhk5rk542z4ezzu06qvp3k39s8gpnx0p8vpqynlspgt0nnc09lesuktzuesmrmahdup9xhe64tj6kexfym48ux0ccueyu0c9evt6tlswc3nff9q4z4d7n648jjnj068yvhnkt6nxz7j3t6sxuerms3t6rxnzve5854nggwqh5aahsey6h8jespte5cz3dw9e8223hf2h2sv7vx36jaz3gwzhmwnxfe49ucjwdfkmjcnxwq9ptez89pjl2eqrh52prq9e8k8n6gajmn2k5ck7n5t7y3uu97j4h3w0xmw77lt20mjwhvljucqkkq7xmjsyhvjsmfjtc09h9vjj4te59vjnnnxu689j7vxzy5mjtskc4lpu409jhsezh5pq42au4fps50zdedx59sashyjnddf9xyjtzf23964nj0awq9j9e3ur3vgvac3v2t0nly0lcxn6mk0kdnta9dyjq7aa5gswe4cn4cj6w6s0qx6s2s8az5pfx9rjgfdx25n2gea82ujzw4j55jte4fskunnfh9y4vjtzdfc4j32309ucntjj2424ynj33fvkz3jfgf98ndjfhxjkv7j90es5n85gr0dpj6t9v5jajf0ffxylp0c95nnxwf44uu9tteqy5x7ffyu3sz546dwmxtualtc0h5f89knj34tdmkrrvknf0pzat0ju7hm3a7hz7raqpg92ug7dpvt9wqygsn2vt9ghwa7mzz2n9mf2qx8dhrj6wuh79aec7dyrrrkwcqlkeu4nn5ttdfkwqz4uhjhvggzq2traln408a6jtm6xn9a0lhchxu5z4dhf7wandtdah3qjdh844tjanauwj73kjmp8sa20pujuarw0azxul6q3w88ll5fc84379zf7wfafrvhwa844090t2cc53pafme08pcaa625hmzaw9hf320ekrc9zhdkmw484cr9zp3tclgr4varwd36xumrsdlxampln5ak6zektrkhhwkw2mua80tfc64268xxwd6qxy37806xjxuamxmhxhkh0g43hz9jymrz7g88xhsvskkrw6ms4k8qph7hzj7lmm9fltmxka3lw0erqv44zy0fq00n4w67nlltrvnvn4pe0yyetnyh0yaeml2n08m7lkhj3qt325u2c4rvgzjlal6lxz8hjsumwldmkdf3futwchzhm7ahsh70y6808eu2ra70e0ptfj3x8vwvluzu5mrla47nl08a7dum8q4240aehnf0s3j2y84llua7t5khjcthemy887q96ps6kyprkxxc8spnrspe0gq6zu2cfqlqqahupz4qfx2v33cup9kvs2075xlhj3n25m3m6ma99z9l8us8mmav4hlcmx77dh6pp8r5wmkuhguhsx4weqvx79kkwdhzhlwh8gj69akvnl44k0zvyrc72u5l4f6c8qcng48huw6xmvzve4wt77hn34ya7at89aflav0s5f0pfglg5nehhn8cdt0lq8zll6sx68e059tr8t53eng3fz5eggsjnj8y8ufjggkh04drxhlvlzw3jq3h947sfdmcdt0wkz3mu6l2neddvevuc4rrkc0dqe9vahlst20k3u8sw8nf9yg3pa2ju4yhumtsyect2kzaa2tnx26yjcuy3dxdhcxlvl0fhmeuj2a8ja46alxh7ec0td08xvmh5zsuunln9tfwmreym60jktdl4ga3frk4spxxfn55zlj7n4xn7wunmed5t8pn9jdp8d9acn37th6q6l2s02stqnt6fmcrld5p8rajtm0hmfuvpjrg3p2uz8ml52j7ue5xk9e4j5mdd46ad8sekvm9j2advq2hrkrl9tkk7t49kv709rexjtgvdja8hmxyrnnaa6yfsgl6lkdtc67860mlv0sq8c0tq684ltxu6nducd4aukmzxylns55shdexdr2qxq9eurmuuhhfe7q");
});

async function acceptOffer(fee: bigint, offerText: string) {
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const nonce = "626f9cf141deefc2e77a56a4ef99996259e840dc4020eda31408cdd442a770d1"
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v2");
  const availcoins: SymbolCoins = {
    [net.symbol]: [
      {
        "amount": 10000000009741n,
        "parent_coin_info": "0x956a64d6987813d70b0ce63b4304a543d65b844016274606deb6b819d4006f54",
        "puzzle_hash": "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"
      },
    ],
  };

  const makerBundle = await decodeOffer(offerText);
  expect(makerBundle).toMatchSnapshot("maker bundle");

  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const revSummary = getReversePlan(summary, change_hex, {});
  expect(revSummary).toMatchSnapshot("revSummary");
  expect(fee).toMatchSnapshot("fee");

  const coin = makerBundle.coin_spends.sort((a, b) => b.puzzle_reveal.length - a.puzzle_reveal.length).at(0);
  if (!coin) fail();

  const puzzle_reveal = coin.puzzle_reveal;
  const solution = coin.solution;
  const nft = await analyzeNftCoin(puzzle_reveal, undefined, coin.coin, solution);
  if (!nft) fail();

  // royalty_amount = uint64(offered_amount * royalty_percentage / 10000)
  const royalty_amount = (revSummary.offered[0].amount * BigInt(nft.tradePricePercentage)) / BigInt(10000);
  expect(royalty_amount).toMatchSnapshot("royalty_amount");
  const offplangen = await generateOfferPlan(
    revSummary.offered,
    change_hex,
    availcoins,
    fee,
    net.symbol,
    royalty_amount
  );
  expect(offplangen).toMatchSnapshot("offplangen");
  const utakerBundle = await generateNftOffer(
    offplangen,
    nft,
    undefined,
    revSummary.requested,
    tokenPuzzles,
    net,
    nonce
  );
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, net.chainId);
  expect(takerBundle).toMatchSnapshot("takerBundle");
  const combined = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(combined, net.chainId);
  expect(combined).toMatchSnapshot("combined");
}