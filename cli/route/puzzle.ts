import express from "express";
import puzzle from "../../lib-chia/services/crypto/puzzle";

interface PuzzleRequest {
  method?: "ToAddress" | string;
  parameters?: string[];
}

export async function puzzleFunc(req: express.Request, res: express.Response): Promise<void> {
  let r: PuzzleRequest | null = null;
  try {
    r = req.body as PuzzleRequest;

    if (r.method == "ToAddress" && r.parameters?.[0]) {
      res.send(
        JSON.stringify({
          address: puzzle.getAddressFromPuzzleHash(r.parameters?.[0], "xch"),
        })
      );
    } else {
      res.status(400).send(JSON.stringify({ success: false, error: "unrecognized method" }));
    }
  } catch (err) {
    console.warn(err);
    if (r) console.log(`${JSON.stringify(r)},`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }));
  }
}
