import { GetParentPuzzleResponse } from "@/models/api";
import { createFakeCatCoin, createFakeXchCoin, getTestAccount, logBundle } from "../utility";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { getOfferSummary, OfferEntity, OfferPlan } from "@/services/offer/summary";
import { combineOfferSpendBundle, generateOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { SymbolCoins } from "@/services/transfer/transfer";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";
import { AccountEntity, PersistentCustomCat, TokenInfo } from "@/models/account";
import { prefix0x } from "@/services/coin/condition";
import { NetworkContext } from "@/services/coin/coinUtility";
import { assertSpendbundle } from "@/services/spendbundle/validator";
import { combineSpendBundle, signSpendBundle } from "@/services/spendbundle";
import { constructPureFeeSpendBundle } from "@/services/coin/nft";

function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }
function tokenInfo() {
  return {
    BSH: {
      symbol: "BSH",
      decimal: 3,
      unit: "BSH",
      id: "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b",
    },
  };
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

test('Offer Encoding', async () => {
  const offerText = "offer1qqp83w76wzru6cmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafrgx923m0l47c8udnalkndly6tx3nlj8kw87vhh5p4vekl6ul7ll0myae24ja0w6azxqnj67rchq77vsy0kw0w4d6k8fvjj7yc4s86alw454adyl0gcyeqhu4fc4c0lt0znmjj7xzq26y0m8mm7n6lesmnlfrj95u0nldhzag2m7yl0fhh7d8f708kwg6hn4h8nlh4clgclva2xuthwndt9n7e8hduamg36278zdl70wdmauhxg0sk7d8zgxc6gy3ks2tyjgcdj82pfvz6rzvk6rqvkmryvxerwqffpm5dz8crzdaqar0grf8knu4ew4ldrz6wpsj6gap0trj63jwt8azy57h6ckrmydaua8dgx2tst4amn0ud8krwtxwgjd5e9nv0zu7d8akufy2matea866ktqhc7hqw44zpzzlev8w2np5m83s754wfc5aa9z645j20lamxwc7smc9acuw7hdtrmwcx7lvazwt722jh4llph6rj5eg0xkugtarwt4cm3hz2rfv8mpggdjznvnlc9s3drnlumgx6jwct4ypp7mle0vp7tymdeun8uexqlpv0me9lm7xgfk0tk4adv3mjft3k8rvta9grwuyep38h0lqj456rjdmwsn05z6mlkdm6hrhkhqaktd0ranetjmvnwe7edhe7la5elaltlg8l8lcgfpj6uwlhxn6254hnn7zhj6cc5v0a88wgm9vt9k85axakerqkplutzddwt8vd0utcs33sl7fs3740z0cj4w8u5rf5m62da4u6av4fr399wkv7ylwlwaf4qhdyd2q479lczgtkssupsxsgxt9xz0tq4ckgrl8my5zw87v3gn36tt6780c05n0m7tukx5dtemj35xelcgxs9p2ypn3mexa8mpxkp6g2fxu2njl46fcyv4jcvdj958vma6ce0suj8p0wdafglydnv9edahwhe4kr5lcrza9etujm6g5t8m4jdtfffrcn080e363wdpfdm8a0ay7vrtl9ftl2pjw4p8lfmdxelwctc8tspul7u7zs8rqqqcc2wacptnhjp";
  const bundle = await decodeOffer(offerText);
  const summary = await getOfferSummary(bundle);

  expect(summary).toMatchSnapshot("summary");
  expect(bundle).toMatchSnapshot("bundle");

  const encoded = await encodeOffer(bundle, 2);
  expect(encoded).toBe(offerText);
});

test('Make Offer 1', async () => {
  const offplan: OfferPlan[] = [
    {
      "id": "",
      "plan": {
        "coins": [
          {
            "amount": 15n,
            "parent_coin_info": "0xd46f5f861aeb19a3ff8c7bbb73aa1797f585332eb846333d5092c7dcc75af204",
            "puzzle_hash": "0x907ecc36e25ede9466dc1db20f86d8678b4a518a4351b552fb19be20fc6aac96"
          }
        ],
        "targets": [
          {
            "address": "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79",
            "amount": 9n,
            "symbol": xchSymbol()
          },
          {
            "symbol": xchSymbol(),
            "address": "0x907ecc36e25ede9466dc1db20f86d8678b4a518a4351b552fb19be20fc6aac96",
            "amount": 6n
          }
        ]
      }
    }
  ];
  const reqs: OfferEntity[] = [
    {
      "id": "0x6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b",
      "symbol": "BSH",
      "amount": 11n,
      "target": "0x907ecc36e25ede9466dc1db20f86d8678b4a518a4351b552fb19be20fc6aac96"
    }
  ];
  const account = getTestAccount("46815978e90da660427161c265b400831ee59f9aae9a40b449fbcd67ca140590");
  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");

  const nonce = "71bdf5d923a48956a8d26a36c6ea4a9959de221ff2ee986bce4827e5f037ceb8";
  const ubundle = await generateOffer(offplan, reqs, tokenPuzzles, net, nonce, "cat_v1");
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  const encoded = await encodeOffer(bundle, 2);

  expect(bundle).toMatchSnapshot("bundle");
  expect(encoded).toMatchSnapshot("offer");
});

const knownCoins = [
  { "parentCoinId": "0xd538ae235752c68078884bfb129e2c0832c2d8ed67674bde6c9a48603e6b875e", "amount": 159, "parentParentCoinId": "0x0cd93529333db5ffcb7aef5a1f9610df8467ae739b083697479dbb88a82467f5", "puzzleReveal": "0xff02ffff01ff02ffff01ff02ff5effff04ff02ffff04ffff04ff05ffff04ffff0bff2cff0580ffff04ff0bff80808080ffff04ffff02ff17ff2f80ffff04ff5fffff04ffff02ff2effff04ff02ffff04ff17ff80808080ffff04ffff0bff82027fff82057fff820b7f80ffff04ff81bfffff04ff82017fffff04ff8202ffffff04ff8205ffffff04ff820bffff80808080808080808080808080ffff04ffff01ffffffff81ca3dff46ff0233ffff3c04ff01ff0181cbffffff02ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff22ffff0bff2cff3480ffff0bff22ffff0bff22ffff0bff2cff5c80ff0980ffff0bff22ff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ff0bffff01ff02ffff03ffff09ffff02ff2effff04ff02ffff04ff13ff80808080ff820b9f80ffff01ff02ff26ffff04ff02ffff04ffff02ff13ffff04ff5fffff04ff17ffff04ff2fffff04ff81bfffff04ff82017fffff04ff1bff8080808080808080ffff04ff82017fff8080808080ffff01ff088080ff0180ffff01ff02ffff03ff17ffff01ff02ffff03ffff20ff81bf80ffff0182017fffff01ff088080ff0180ffff01ff088080ff018080ff0180ffff04ffff04ff05ff2780ffff04ffff10ff0bff5780ff778080ff02ffff03ff05ffff01ff02ffff03ffff09ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff01818f80ffff01ff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ffff04ff81b9ff82017980ff808080808080ffff01ff02ff5affff04ff02ffff04ffff02ffff03ffff09ff11ff7880ffff01ff04ff78ffff04ffff02ff36ffff04ff02ffff04ff13ffff04ff29ffff04ffff0bff2cff5b80ffff04ff2bff80808080808080ff398080ffff01ff02ffff03ffff09ff11ff2480ffff01ff04ff24ffff04ffff0bff20ff2980ff398080ffff010980ff018080ff0180ffff04ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff04ffff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ff17ff808080808080ff80808080808080ff0180ffff01ff04ff80ffff04ff80ff17808080ff0180ffffff02ffff03ff05ffff01ff04ff09ffff02ff26ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff0bff22ffff0bff2cff5880ffff0bff22ffff0bff22ffff0bff2cff5c80ff0580ffff0bff22ffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bff2cff058080ff0180ffff04ffff04ff28ffff04ff5fff808080ffff02ff7effff04ff02ffff04ffff04ffff04ff2fff0580ffff04ff5fff82017f8080ffff04ffff02ff7affff04ff02ffff04ff0bffff04ff05ffff01ff808080808080ffff04ff17ffff04ff81bfffff04ff82017fffff04ffff0bff8204ffffff02ff36ffff04ff02ffff04ff09ffff04ff820affffff04ffff0bff2cff2d80ffff04ff15ff80808080808080ff8216ff80ffff04ff8205ffffff04ff820bffff808080808080808080808080ff02ff2affff04ff02ffff04ff5fffff04ff3bffff04ffff02ffff03ff17ffff01ff09ff2dffff0bff27ffff02ff36ffff04ff02ffff04ff29ffff04ff57ffff04ffff0bff2cff81b980ffff04ff59ff80808080808080ff81b78080ff8080ff0180ffff04ff17ffff04ff05ffff04ff8202ffffff04ffff04ffff04ff24ffff04ffff0bff7cff2fff82017f80ff808080ffff04ffff04ff30ffff04ffff0bff81bfffff0bff7cff15ffff10ff82017fffff11ff8202dfff2b80ff8202ff808080ff808080ff138080ff80808080808080808080ff018080ffff04ffff01a072dec062874cd4d3aab892a0906688a1ae412b0109982e1797a170add88bdcdcffff04ffff01a06e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6bffff04ffff01ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0b5c7539888af59f601be0ea2eddd32c06a80d932170eec55ef7a7640cbc5b37b81c4258644229eca2322298a9bf0189fff018080ff0180808080" },
];

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}

test('Make Offer 2', async () => {
  const offplan: OfferPlan[] = [
    {
      "id": "0x6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b",
      "plan": {
        "coins": [
          {
            "amount": 100n,
            "parent_coin_info": "0xd538ae235752c68078884bfb129e2c0832c2d8ed67674bde6c9a48603e6b875e",
            "puzzle_hash": "0x9d974f53c5a3d12ef729f38f2c1603b4f4f959a033d0a6ed763fab46a7cc5577"
          }
        ],
        "targets": [
          {
            "address": "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79",
            "amount": 10n,
            "symbol": "BSH",
            "memos": [
              "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79"
            ]
          },
          {
            "symbol": "BSH",
            "address": "0x907ecc36e25ede9466dc1db20f86d8678b4a518a4351b552fb19be20fc6aac96",
            "amount": 90n
          }
        ]
      }
    }
  ];
  const reqs: OfferEntity[] = [
    {
      "id": "",
      "symbol": xchSymbol(),
      "amount": 5n,
      "target": "0x907ecc36e25ede9466dc1db20f86d8678b4a518a4351b552fb19be20fc6aac96"
    }
  ];
  const account = getTestAccount("46815978e90da660427161c265b400831ee59f9aae9a40b449fbcd67ca140590");
  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");

  const nonce = "741f8564b6637aee92dd68548cfe7df8ec35b20029235565244944febd68bf8d";
  const ubundle = await generateOffer(offplan, reqs, tokenPuzzles, net, nonce, "cat_v1");
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  const encoded = await encodeOffer(bundle, 2);

  expect(bundle).toMatchSnapshot("bundle");
  expect(encoded).toMatchSnapshot("offer");
});

test('Take Offer Xch For CAT', async () => {
  const offerText = "offer1qqp83w76wzru6cmqvpsxygqqgtz8czhc9m7htaj54ten8j0925a2n80flhclm8y8lshnwepyfuud2rjnqu9ad5t6d66fuxaduarwhww30fh2p6eewzcm0g8gm6q6ga5l9wt40mvck3syykk8cf6cak5vnself3989uk9s7arl08pm29j8syaza7x97wa8uu7nqhartj4nmpuhgfkgxj7rj0pptuh0hjxwhfdn5zzwj6waprhayvzzvstkmhwy96gnrhrww0ucvdnhjde2deavetuka6gmuztlmthuse576dwgh4qjgyh2e7vrmzamxujwerhvymlmwxlgm40cqhw0s9dgxljtaeflny45vcdvsuyz3fqawhwf3ahfx7evh8uh7nh5al39tc7jh6m3h6hdwqemvrycwn7uaudgfckgfnyp6m2062v573c77auzpn0mpl23glattdra2279yjer8kl8u6g8kx6wluvetxdmtpvruhh6tfhxmzezkhgtzjt6t8mj7xdk25wkew6pttd5qzf68l30mr6ujv0gln0tpl70832z0mpnjcy0vl53nxml8uyweh4h9z420l87atcyyaqxygmrnqx23nl7l7pa2587lm5xkkkxe8zskwy64lytcywja2l5a4a25q66swvhl2gdm0qwuqg44l0s23zj9v5ful0s97xvfgh3w2795awuch4rkrnvd04t9hgm8ha6vtte57m6tececa4jytujlc5zc7z86c4tfv74jnz2764ze8wmxml9jlnnva7ap80nxmd8xpwmyla77kdsgv5y5tevmwnyreag7z9wlfwefjfwyqrug4c2cuc00dv";

  const account = getTestAccount("46815978e90da660427161c265b400831ee59f9aae9a40b449fbcd67ca140590");

  const makerBundle = await decodeOffer(offerText);
  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const change_hex = "0x907ecc36e25ede9466dc1db20f86d8678b4a518a4351b552fb19be20fc6aac96";
  const nonce = "c616dec58b3c9a898b167f4ea26adb27b464c7e28d2656eeb845a525b9f5786c";
  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
  // const availcoins = await coinHandler.getAvailableCoins(tokenPuzzles, coinHandler.getTokenNames(account));
  const availcoins: SymbolCoins = {
    "BSH": [
      {
        "amount": 100n,
        "parent_coin_info": "0xd538ae235752c68078884bfb129e2c0832c2d8ed67674bde6c9a48603e6b875e",
        "puzzle_hash": "0x9d974f53c5a3d12ef729f38f2c1603b4f4f959a033d0a6ed763fab46a7cc5577"
      }
    ]
  };

  const cats = getCatNameDict(account);
  expect(cats).toMatchSnapshot("cats dict");
  const revSummary = getReversePlan(summary, change_hex, cats);
  expect(revSummary).toMatchSnapshot("reverse summary");
  const offplan = await generateOfferPlan(revSummary.offered, change_hex, availcoins, 0n, xchSymbol());
  expect(offplan).toMatchSnapshot("offer plan");
  const utakerBundle = await generateOffer(offplan, revSummary.requested, tokenPuzzles, net, nonce, "cat_v1");
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, net.chainId);
  expect(takerBundle).toMatchSnapshot("taker bundle");
  const combined = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(combined, net.chainId);
  expect(combined).toMatchSnapshot("bundle");
});

test('Take Offer CAT For Xch', async () => {
  const offerText = "offer1qqp83w76wzru6cmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafrgx923m0l4lupujuu7m6vvmjxy042f2esn0hm4nalt3ym0dhrf29e0h9nxc6y69h2s54rzkly49yh8a9k2lr60zg662fakned6dx6s7nt4eqj492v0l3s2chhqxsy0sqkdqvxdamm7ywnp0t098yzel2449djcf3dhtq6gg8wd53e3ua8ms99je6e2hxqedeet94hulx27n8zdejp9tyh8le7ael208halsp8m8r6hnv5smpga6pytnlghvzr2uj8mvs6xmvs68mvs69mq30py53dnkpzuaskj3wnhyz5ame72u42nkf3dnzgddvtsnk3nvgl8ps7lr6gtp0tda697wvr65tz0gt6fmu2tul6tcflxfw6xh9087pe2sn2sd9u89wzzl6wmw5vawsmtgyz99mjgwumlrfk0pp4dc7pkwa9v3l7vdwy0dlgahw6xq7ep5ms638em6ztata27vu86arnw433r4fkjujhnfc5jk6tkehlzqvgltfagqrtdsz6y4l30yr2vqqwxaxtllpy4s8xrgf4z2eh49hs8235l7l6p60c5ted08ll85ffk7xyl499vhy0au6j0hvl2jepfsas2k72rm9hv8jus6nuhlsv67fe4w8p4mkp69cackca8k7n3h4neat94hwswgh0n56nqlmuj4ehj93jwxk8cdlcteg4najd5n22477rkjmalpggsh8qwqu84a6hadwtkf0tufzffkhxycpx6gk5trutlqxs7d3hlym256r2yn9zd34fqj0q2njjpvmh89l6tpdwt9f3wfr77c7eq9cua47hge0sg8w40svjl4lajpw7dltassqm79h8j4aeye7m0ukjr8vcuhhenhllknlavj0sttaj6kwawlhllct7h08aav3lv0skez9gzpk936semac0meg8ldxkmmchj3kre07grqpnwkstyz9uhlz";

  const account = getTestAccount("029f493caf194d4a67a6a5bad588c12ff1f2512f5db7118fd4005492b9dafbb5");

  const makerBundle = await decodeOffer(offerText);
  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const change_hex = "0xb379a659194799dfa9171f7770f6935b1644fe48fd6fb596d5df0ac2abff2bda";
  const nonce = "c616dec58b3c9a898b167f4ea26adb27b464c7e28d2656eeb845a525b9f5786c";
  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
  // const availcoins = await coinHandler.getAvailableCoins(tokenPuzzles, coinHandler.getTokenNames(account));
  const availcoins: SymbolCoins = {
    [xchSymbol()]: [
      {
        amount: 7n,
        parent_coin_info: "0x4eb49d82f126a408914ab23552b8aba955dd19c329d1489a0275556c7012b7e7",
        puzzle_hash: "0xb379a659194799dfa9171f7770f6935b1644fe48fd6fb596d5df0ac2abff2bda",
      }
    ]
  };

  const cats = getCatNameDict(account);
  expect(cats).toMatchSnapshot("cats dict");
  const revSummary = getReversePlan(summary, change_hex, cats);
  expect(revSummary).toMatchSnapshot("reverse summary");
  const offplan = await generateOfferPlan(revSummary.offered, change_hex, availcoins, 0n, xchSymbol());
  expect(offplan).toMatchSnapshot("offer plan");
  const utakerBundle = await generateOffer(offplan, revSummary.requested, tokenPuzzles, net, nonce, "cat_v1");
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, net.chainId);
  expect(takerBundle).toMatchSnapshot("taker bundle");
  const combined = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(combined, net.chainId);
  expect(combined).toMatchSnapshot("bundle");
});

test.each([
  0n, 5n
])('Take Offer with multiple XCH with fee %p included', async (fee: bigint) => {
  const offerText = "offer1qqzh3wcuu2rykcmqvpsxvgqq8e55mct6w4chdkauhaetm8svr28uavw0j9cn8v9udxaljqe8clsk62mqatswm4x3mflmfasl4h75w6ll68d8ld8klul4pdflhpc97c97aaeu9w7kgm3k6uer5vnwg85fv4wp7cp7wakkphxwczhd6ddjtf24qedh55nzsh8fnh4h2jwdwpdad95a4uhj04ma9lkm4hx3drfp82mjhp0szkj4pj4pvpv395yp5ndgxdpxg94gymzq3at64k8hql2kh24j44a58ncepxldyn8f6nawvet3sle65qyafd7qwzg4nxj77c3clk4f4lh4m4wm5al7jq2leraf7luyjjp7lf094qhqe77lejl9pqggw5sph0uxcj9znxd3tlctw7es0a9dra6rkld2hnallwud0e6gupwa2uh0cf3nytc0nfjwm8q7lnrfhm7kj50vvpm0maktqhmsa8zgu3n8yw4jwk6kdspnv5mk89hhwsrd4vxw0atcvzpnwt8u76nurz737lq0ep02qkmr7rjd9wwzexqnah70lw4v0wavhgnrp5gke5a607lxk45cesejz600565jkdxqtgdjpz06l7p9mrcuj00w7r0talw9xewz8e3ejc80q7yhjwcllly2c04h4r4w0l87etlk6rqh006rgxyqrfk0utcgma6l3e95l04pht58eaep97lthtmggwhnsm0c5ckzjlf0gn87l9kr2q92ktlm7cyaa5wdx4zrg8ls8p5t8lnrzla6lnwx9k7plxtnh4lamav8e880wkl3zwy5rzp0hljyhhv07sttwt6ut6xl5ye0ha3u8j4a9h9ydtj77ulavmegkrc0370dlxk423vj3mrsa98ma8fs702tq9mkwexvh968wfata88wlpu37v9kc57u5h5vknvfaj4ls2rhnhdfm0jh87e89vjfc9hv83c6vh8f780yj8ulpw962tuhn4ajdm707t3zjra8fvd9ljej4pl6hzs5mwm079asd40jt5a7xdqm9cwrwyp5a726llem57n07jtxaku7dr7h77ahl77ujcqlf4a2qahva0zym2e9l77k2nmgzz0p2a055z23q9clmwtekwk34j477ht4ttxlh65800fkdncmkhth50hh97twqju2khd9fa862d9maluwrx89kx9rfvle4tr6jjawswtt0ze79eag5l0mwt66wlj98pvw9nnmxmmt3u0syqrl0e9cqenx3l4";
  await testOffer(offerText, fee);
});

test.each([
  0n,
  // 5n // TODO: the fee should be calculated when adversary already included the fee
])('Take Offer with fee in original offer with fee %p included', async (fee: bigint) => {
  const offerText = "offer1qqzh3wcuu2rykcmqvpsx2gqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpagr90qq0a37v8lc9m26elwxmwmwhq0drrjdhm3hdsl7dg6cn22lwvv8c6mmvt4rv7aaq5rytqhn7c7pr03mxsxmlv3mk47yjtj7fk40ahnk5tedm0k2s2k5tp603g7ctdmjg9trsvd2hdtrulpyx9p5uhauv0hzdk0jcg4l6lad0na2n0r2yaml2rlnxtjjd40vkdwxu9485j72ljemd0la9krwz8k6a84law4atr6uh9va8uqljglkq94nys5sudk0cmdk0gmdk0gldk0gldktgl0k07s94elqgt7cz7d7e7y77k5mp5mumrvvn2g0hfqkw87sq7wukkqlrwcr8dmdwj8264q32twn8ruxskylaklvrfvfv886c8nj83d04cphrkc9knskjnv8efxe6vv954fq2acyx7verhvxpr0aw8947hk2n7h7ddmr7ul6xqet2ygkjq7l82a4a8m7kxewe82rjugfnhxfw7fnnh74k70half04zqhr4fcdsypdezqqvjymanlsyskd8dczhp9sx2gfjdhlz7wptmdu5lhtm668lj5snctje2g48h48pyhpyk8479uthpdh9pm5ec2k5q40hlctynje7up9rav3tts5vnurvcuzcr43w7a87389ft3k0ucwx7ys6vze79zgdtltls8d73zetj5uzdthadzv39y94kg60mx4rfkh556hlj7k97ex0hhwlhhye88tr0lzlkq6anu40c83nfwwv6fm8udtetetlku9vg8raszzwaawkde6whr6tf0qnv5tgq37hlczgtxjezzacjv9gamhmvge2vhd9gqcakuwtdmzaclh8re5svvwelqrum8nk2wp0daxe6qfspq2s3h5ctxp4cmgv0eemv0wtknaw084vutl8cuawg95d0lc22gk823d5rcgnyzxmxu0ucxzyusxy39e3lr8scjwt2nntu0pwt8u5edu0epk28s788vlcan3vtet6hvm2wff8pt7c6wkvag99dhah7qx6jhc6vy30vk4h9ljlt4a0e9xd3vfmwrh203u8ylwnck290wxv4ch0ur0hl5f4z9w5aue240ttdmwmjuj809nums0yym6qhd98duexlzgvv2a9uf3nr29dtrjyvrx8s6zv3u7vr72tjnuuhewar82qdgs593hzcyzm86lhfntdzs9ua3t6xtqrlxla2uc94dr757fcpq9agrlkwwu3th4jyhdnmc9ncnd0xhkhhc7suc63kvcrz5ea94dxjm8wt0r40nd5w88khw25n8f26e0wvja6r7a63akh50a7ldm6tk656vxa8l9tvm0xunh2dl88u7vzaxqc8g8ule4vt50w3v3zmv4w86gvu27une32a5e4el37nch04mkva4n983m6gajwhahvty7kk3lrdarmdpsqnlg4lmqr83nud";
  await testOffer(offerText, fee);
});

test('Take offer with fee included', async () => {
  const offerText = "offer1qqz83wcsltt6wcmqvpsxygqq0c4y6w67u8n8stlljf3dfcsfl5hulnrqd87pgl7xu9s7mzhjrjh76w3swhczdkrgc5m94vvd2ek2x9wmdrznvk43l506pzsd22uz7vxl7uu7zhtt50cmdwv32yfh9r7yx2hq7vylhvmrqmn8vrt7uxje45423v3up8gh0330nhfl885c9lg6u4v7c096zdjp5hsuncg2l9mau3n46tvap2szt2mcmns4svc5sekp88k73ucwfg8jm432k0welw8dxj4uft3ln2lvezkd550ca98nrc4qqe4mqhrzd40mt7elspffhx9fu7mu783dhhgv5g08llprg098m8zy0pm604yzsu5ss2crtxvdl7r4h0gphjd0hkfstknk4j9xn6wu7l2e9w66ym4c2e2fcta8nvuvpzvszm48kpyatgf52kr0xj3nkrq3hx508fwwmv6vtrm0xkwjl2f7hzau33az0xc7kregkus42xwpt6tn2p8ktxjx6vx3xf6ha70mxd47asxlspwkmgqyn5llzlk84eyc73lx7krlu70z5ylkr89sg7elfrxdh70cgan0tw2925l70a6hlehkvmzm6qq9vj3s42d4jfklqv4ttlal5r6rnku8ns7lyrez26740whhha8hlkl77lvs7d8h47w0ve8x4tlk76kac8smfazsnmz2nx5vnde45rmfdwr5llcskf68k5lm93yext0d0k9uxvjrrqlajw90lz6unluu3t0c9x9ata075vvlnpj8hje49cj0rs9e9mv66rzvfualejl7n6uzp2mav63unmwncukjvxcu8dmw45z2h645vm2pmjxp6dcp9ek9w4ggdva4m";
  await testOffer(offerText, 5n);
});

// test.each([
//   0n, 5n
// ])('Take offer by CAT-CAT with fee %p included', async (fee: bigint) => {
// });

async function testOffer(offerText: string, fee = 0n): Promise<void> {

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const makerBundle = await decodeOffer(offerText);
  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const change_hex = "0xb379a659194799dfa9171f7770f6935b1644fe48fd6fb596d5df0ac2abff2bda";
  const nonce = "c616dec58b3c9a898b167f4ea26adb27b464c7e28d2656eeb845a525b9f5786c";

  const assetId = summary.requested.at(0)?.id || summary.offered.at(0)?.id;

  const assetName = "CAT";
  const tokenInfo = { [assetName]: { symbol: assetName, decimal: 3, unit: assetName, id: assetId, }, }
  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo, xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const p2Puzzle = tokenPuzzles.at(0)?.puzzles.at(0)?.puzzle;
  if (!p2Puzzle) fail();
  const availcoins: SymbolCoins = {};

  if (assetId) {
    const { cat, parent } = await createFakeCatCoin(prefix0x(assetId), p2Puzzle);
    knownCoins.push(parent);
    availcoins[assetName] = [cat];
  }
  availcoins[xchSymbol()] = [await createFakeXchCoin(p2Puzzle)];

  const cats = getCatNameDict(account, tokenInfo);
  expect(cats).toMatchSnapshot("cats dict");
  const revSummary = getReversePlan(summary, change_hex, cats);
  expect(revSummary).toMatchSnapshot("reverse summary");
  const offplan = await generateOfferPlan(revSummary.offered, change_hex, availcoins, 0n, xchSymbol());
  expect(offplan).toMatchSnapshot("offer plan");

  const feeBundle = fee > 0n
    ? await constructPureFeeSpendBundle(change_hex, fee, availcoins, tokenPuzzles, net, false)
    : undefined;

  const utakerOfferBundle = await generateOffer(offplan, revSummary.requested, tokenPuzzles, net, nonce, "cat_v2");
  const utakerBundle = combineSpendBundle(utakerOfferBundle, feeBundle);
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, net.chainId);
  expect(takerBundle).toMatchSnapshot("taker bundle");
  const combined = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(combined, net.chainId, fee);
  expect(combined).toMatchSnapshot("bundle");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCatNameDict(_account?: AccountEntity, ti: TokenInfo = tokenInfo()): { [id: string]: string } {
  const cats: PersistentCustomCat[] = [];
  return Object.assign(
    {},
    ...Object.values(ti).map((_) => ({ [prefix0x(_.id ?? "")]: _.symbol })),
    ...(cats.map((_) => ({ [prefix0x(_.id)]: _.name })))
  );
}
