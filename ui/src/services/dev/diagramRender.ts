import { AggSigMessage, AnnouncementCoin, CoinAvailability, CoinIndexInfo } from "../../../../lib-chia/services/spendbundle";

export function gerMermaidDiagramDefinition(
  aggSigMessages: AggSigMessage[],
  coinMods: { coinIndex: number; mods: string }[],
  puzzleAnnoCreates: AnnouncementCoin[],
  puzzleAnnoAsserted: AnnouncementCoin[],
  coinAnnoCreates: AnnouncementCoin[],
  coinAnnoAsserted: AnnouncementCoin[],
  coinAvailability: CoinAvailability[],
  createdCoins: { [key: string]: CoinIndexInfo }
): string {
  let graphDefinition = "graph LR;";
  // graphDefinition += "SIG(SIG);";
  for (let i = 0; i < aggSigMessages.length; i++) {
    const sig = aggSigMessages[i];
    graphDefinition += `${sig.coinIndex}:::${sig.coinName ? "Sig" : "SigUnsafe"};`;
    // graphDefinition += `SIG -- SIG --> ${sig.coinIndex};`;
  }

  for (let i = 0; i < coinMods.length; i++) {
    const coin = coinMods[i];

    if (!coin.mods) continue;
    const mods =
      coin.mods == "singleton_launcher()"
        ? "Launcher"
        : coin.mods == "p2_delegated_puzzle_or_hidden_puzzle()"
        ? "XCH"
        : coin.mods == "settlement_payments()"
        ? "XCH-O"
        : coin.mods == "settlement_payments_v1()"
        ? "XCH-O"
        : coin.mods == "cat_v2()"
        ? "CAT"
        : coin.mods == "cat_v2(p2_delegated_puzzle_or_hidden_puzzle())"
        ? "CAT"
        : coin.mods == "cat_v2(settlement_payments())"
        ? "CAT-O"
        : coin.mods == "cat_v2(settlement_payments_v1())"
        ? "CAT-O"
        : coin.mods == "singleton_top_layer_v1_1(did_innerpuz(p2_delegated_puzzle_or_hidden_puzzle()))"
        ? "DID"
        : coin.mods ==
          "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),p2_delegated_puzzle_or_hidden_puzzle())))"
        ? "NFT"
        : coin.mods ==
          "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),settlement_payments())))"
        ? "NFT-O"
        : coin.mods ==
          "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),settlement_payments_v1())))"
        ? "NFT-O"
        : "";
    if (coin.mods && !mods) console.warn("mods", coin.mods);
    if (!mods) continue;

    graphDefinition += `${coin.coinIndex}[${coin.coinIndex}:${mods}];`;
  }

  for (let i = 0; i < puzzleAnnoAsserted.length; i++) {
    const ass = puzzleAnnoAsserted[i];
    const cre = puzzleAnnoCreates.find((_) => _.message == ass.message);
    if (cre) {
      graphDefinition += `${ass.coinIndex} -- PA --> ${cre.coinIndex};`;
    } else {
      graphDefinition += `${ass.coinIndex} -- PA --> ?;`;
    }
  }

  for (let i = 0; i < coinAnnoAsserted.length; i++) {
    const ass = coinAnnoAsserted[i];
    const cre = coinAnnoCreates.find((_) => _.message == ass.message);
    if (cre) {
      graphDefinition += `${ass.coinIndex} -- CA --> ${cre.coinIndex};`;
    } else {
      graphDefinition += `${ass.coinIndex} -- CA --> ?;`;
    }
  }

  for (let i = 0; i < coinAvailability.length; i++) {
    const av = coinAvailability[i];
    if (av.availability == "Ephemeral") {
      graphDefinition += `${av.coinIndex} -- CP --> ${av.dependenceIndex};`;
    }
  }

  const ccoins = Object.values(createdCoins)
    .filter((_) => !_.nextIndex)
    .map((_) => ({ name: _.coinName.slice(2, 8), amount: _.amount, coinIndex: _.coinIndex }));

  if (ccoins.length > 0) {
    graphDefinition += `subgraph UTXO;${ccoins.map((_) => _.name).join(";")};end;`;
    graphDefinition += ccoins.map((coin) => `${coin.name} --> ${coin.coinIndex};`).join("");
  }

  graphDefinition += `classDef Sig fill:#EFFAF5,stroke:#48C78E;`;
  graphDefinition += `classDef SigUnsafe fill:#FFFAEB,stroke:#FFE08A;`;
  graphDefinition += `classDef NoSig fill:#FEECF0,stroke:#F14668;`;
  graphDefinition = graphDefinition.replaceAll(";", ";\n");
  return graphDefinition;
}
