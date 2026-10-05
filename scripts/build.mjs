import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import path from "node:path";
const worlds = JSON.parse(await readFile("worlds.json", "utf8"));
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
const cards = [];
for (const world of worlds) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(world.slug))
    throw new Error("Invalid world slug");
  // Explicit publishing allowlist: no raw videos, documents or prototype snapshots.
  for (const file of [
    "index.html",
    "styles.css",
    "src/game.js",
    "src/simulation.js",
  ]) {
    const output = path.join("dist", world.slug, file);
    await mkdir(path.dirname(output), { recursive: true });
    await copyFile(path.join(world.slug, file), output);
  }
  const links = world.videos
    .map((video) => {
      if (!/^[\w-]{11}$/.test(video.youtubeId))
        throw new Error("Invalid YouTube video ID");
      return `<li><a href="https://www.youtube.com/watch?v=${video.youtubeId}">${escape(video.title)}</a></li>`;
    })
    .join("");
  if (links) {
    const file = `dist/${world.slug}/index.html`;
    const html = await readFile(file, "utf8");
    await writeFile(
      file,
      html.replace(
        "</main>",
        `<section><h2>Watch and play</h2><ul>${links}</ul></section></main>`,
      ),
    );
  }
  cards.push(
    `<article class="world-card"><div class="garden-art"><img src="./assets/helicopter-garden.png" alt="Peck and Dot watching a winged seed float over the garden fence" width="1536" height="1024" loading="lazy"></div><div class="world-copy"><p class="eyebrow">A little world · Ages ${escape(world.ages)}</p><h3>${escape(world.title)}</h3><p>${world.slug === "helicopter-seeds" ? "A spinning seed. A cheeky chicken. Where will the breeze take you?" : escape(world.description)}</p><a class="button" href="./${world.slug}/index.html">${world.slug === "helicopter-seeds" ? "Play with the breeze" : "Let’s play"} <span aria-hidden="true">↗</span></a></div></article>`,
  );
}
for (const file of [
  "about.html",
  "tutors.html",
  "privacy.html",
  "site.css",
  "assets/open-kit.png",
  "assets/helicopter-garden.png",
  "assets/logo.svg",
  "assets/logo-mono.svg",
  "assets/favicon.svg",
]) {
  const output = path.join("dist", file);
  await mkdir(path.dirname(output), { recursive: true });
  await copyFile(path.join("site", file), output);
}
const homepage = await readFile("site/index.html", "utf8");
await writeFile(
  "dist/index.html",
  homepage.replace("<!-- WORLD_CARDS -->", cards.join("")),
);
await writeFile("dist/.nojekyll", "");
console.log(`Built ${worlds.length} world(s) in dist/`);
