import test from "node:test";
import assert from "node:assert/strict";
import { buildSocioCardData, buildShareContent } from "../lib/socio-card-data.ts";

const paid = { spotId: "one", spotName: "団体A", joinedAt: "2026-01-01", status: "active" };
const follow = { spotId: "two", spotName: "クリエイターB", followedAt: "2026-02-01" };

test("無料と月額を会員証に表示し重複を数えない", () => {
  const result = buildSocioCardData("u", "会員", [paid], [follow, { spotId: "one", spotName: "団体A", followedAt: "2025-12-01" }]);
  assert.equal(result.spotCount, 2);
  assert.deepEqual(result.memberships.map((m) => m.spotId), ["one", "two"]);
  assert.equal(result.memberships[1].joinedAt, "2026-02-01");
});

test("解約後も無料サポート中なら一件として表示する", () => {
  const result = buildSocioCardData("u", "会員", [{ ...paid, status: "canceled" }], [{ spotId: "one", spotName: "団体A", followedAt: "2026-03-01" }]);
  assert.equal(result.spotCount, 1);
  assert.equal(result.memberships[0].joinedAt, "2026-03-01");
});

test("サポートがない場合は星を増やさず共有先はSPOT一覧", () => {
  const result = buildSocioCardData("u", "会員", [], []);
  assert.equal(result.spotCount, 0);
  assert.match(buildShareContent(result).url, /\/spots$/);
});
