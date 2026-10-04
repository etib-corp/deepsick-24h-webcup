import assert from "node:assert/strict";
import test from "node:test";
import { coalesce } from "../lib/coalesce";

test("a cold burst shares identical reads but separates query arguments", async () => {
  let reads = 0;
  const read = coalesce(async (id: number) => { reads++; return id; });
  const values = await Promise.all([...Array.from({ length: 100 }, () => read(1)), read(2)]);
  assert.equal(reads, 2);
  assert.deepEqual(new Set(values), new Set([1, 2]));
  await read(1);
  assert.equal(reads, 3);
});

test("a failed shared read clears the entry and a later request can recover", async () => {
  let attempts = 0;
  const read = coalesce(async () => {
    if (++attempts === 1) throw new Error("Temporary failure");
    return "recovered";
  });
  const results = await Promise.allSettled(Array.from({ length: 100 }, () => read()));
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(await read(), "recovered");
  assert.equal(attempts, 2);
});
