import utility from "../services/crypto/utility";


test('adds 1 + 2 to equal 3', async () => {
  const hash = await utility.hash("test");
  expect(hash).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
  expect(1 + 2).toBe(3);
});