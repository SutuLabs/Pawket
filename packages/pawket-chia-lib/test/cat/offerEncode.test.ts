import { decodeOffer, encodeOffer } from "../../services/offer/encoding";
import { getOfferSummary } from "../../services/offer/summary";
import { Instance } from "../../services/util/instance";

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
  expect(encoded).toMatchSnapshot("newOffer");
});
