import { Instance } from "../../src/services/util/instance";
import request from "supertest"
import app from "../app"
import bcase1 from "./cases/block_case1.json"
import bcase2 from "./cases/block_case2.json"
import bcase3 from "./cases/block_case3.json"
import bcase4 from "./cases/block_case4.json"
import bcase5 from "./cases/block_case5.json"
import bcase6 from "./cases/block_case6.json"
import bcase7 from "./cases/block_case7.json"
import bcase8 from "./cases/block_case8.json"
import pcase1 from "./cases/puzzle_case1.json"
import txcase1 from "./cases/tx_case1.json"

beforeAll(async () => {
  await Instance.init();
})

jest.setTimeout(30000);

describe("Parsing API test", () => {
  test('Block Parsing Case 1', () => testCase("/parse_block", bcase1));
  test('Block Parsing Case 2', () => testCase("/parse_block", bcase2));
  test('Block Parsing Case 3', () => testCase("/parse_block", bcase3));
  test('Block Parsing Case 4', () => testCase("/parse_block", bcase4));
  test('Block Parsing Case 5', () => testCase("/parse_block", bcase5));
  test('Block Parsing Case 6', () => testCase("/parse_block", bcase6));
  test('Block Parsing Case 7', () => testCase("/parse_block", bcase7));
  test('Block Parsing Case 8', () => testCase("/parse_block", bcase8));

  test('Puzzle Parsing Case 1', () => testCase("/parse_puzzle", pcase1));
  test.each(txcase1.map(_ => Object.assign(_, { toString: function () { return this.id; } })))(
    "Analyze Tx Case %s",
    (ca) => testCase("/analyze_tx", ca)
  );
});

async function testCase(url: string, cs: any, name: string | undefined = undefined): Promise<void> {
  const resp = await request(app).post(url).send(cs);
  expect(resp.status).toBe(200);
  expect(JSON.parse(resp.text)).toMatchSnapshot(name ? `${name} response` : "response");
}

describe("Puzzle API test", () => {
  test('Puzzle To Address', async () => {
    const resp = await request(app).post("/puzzle").send({ method: "ToAddress", parameters: ["0xb93495c7c2f956454ee75f96c0e5ca51d0b8165aebe6e15e8a1f288512b97f6c"] });
    expect(resp.status).toBe(200);
    expect(JSON.parse(resp.text)).toMatchSnapshot("response");
  });
});