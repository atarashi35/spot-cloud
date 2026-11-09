import test from "node:test";
import assert from "node:assert/strict";
import { canReceiveActivity } from "../lib/server/notification-audience.ts";

test("公開投稿は無料・月額サポーターに届く", () => {
  assert.equal(canReceiveActivity("public", 0, null, true), true);
  assert.equal(canReceiveActivity("public", 0, { status: "active", planAmount: 100 }, false), true);
  assert.equal(canReceiveActivity("public", 0, null, false), false);
});

test("口数限定投稿は条件を満たす有効な月額サポーターだけに届く", () => {
  assert.equal(canReceiveActivity("paid", 1000, { status: "active", planAmount: 500 }, true), false);
  assert.equal(canReceiveActivity("paid", 1000, { status: "active", planAmount: 1000 }, false), true);
  assert.equal(canReceiveActivity("paid", 1000, { status: "canceling", planAmount: 1000 }, false), true);
  assert.equal(canReceiveActivity("paid", 1000, { status: "canceled", planAmount: 1000 }, true), false);
  assert.equal(canReceiveActivity("paid", 0, null, true), false);
});
