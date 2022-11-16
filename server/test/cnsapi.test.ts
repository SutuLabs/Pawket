import { Instance } from "../../src/services/util/instance";
import request from "supertest"
import app from "../app"
import case1 from "./cases/cns_case1.json"

beforeAll(async () => {
  await Instance.init();
})

jest.setTimeout(30000);

describe("CNS", () => {
  test('offer generation', async () => {
    const resp = await request(app).post("/cns_offer").send(case1);
    expect(resp.status).toBe(200);
    expect(JSON.parse(resp.text)).toMatchSnapshot("response");
  });
});
