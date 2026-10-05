import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
test("static build contains only approved files and relative activity references", () => {
  execFileSync(process.execPath, ["scripts/build.mjs"]);
  function files(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
  }
  const output = files("dist");
  assert.equal(output.length, 16);
  assert.ok(
    output.every(
      (file) =>
        !/\.(mov|docx)$/i.test(file) && !/Preview|Pre-final|Final/.test(file),
    ),
  );
  const html = readFileSync("dist/helicopter-seeds/index.html", "utf8");
  assert.ok(html.includes('href="./styles.css"'));
  assert.ok(html.includes('src="./src/game.js"'));
});
