import test from "node:test";
import assert from "node:assert/strict";
import { fallSpeed, groundHeight } from "../helicopter-seeds/src/simulation.js";
test("a larger wing slows descent at the same weight", () => {
  assert.ok(fallSpeed(0.3, 1.8) < fallSpeed(0.3, 0.5));
});
test("a heavier seed descends faster with the same wing", () => {
  assert.ok(fallSpeed(0.9, 1) > fallSpeed(0.1, 1));
});
test("invalid seed designs fail explicitly", () => {
  assert.throws(() => fallSpeed(0, 1), RangeError);
  assert.throws(() => fallSpeed(0.3, -1), RangeError);
});
test("garden is flat and the meadow joins continuously into raised hills", () => {
  assert.equal(groundHeight(0, 3), -0.025);
  assert.ok(Math.abs(groundHeight(0, -8.00001) - groundHeight(0, -8)) < 0.0001);
  assert.ok(groundHeight(0, -17) > 0.5);
});
