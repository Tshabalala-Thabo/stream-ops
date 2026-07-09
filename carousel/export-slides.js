const { spawnSync } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const { resolve } = require("node:path");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const deckName = process.argv[2] ?? "streamops-upload-failure-v3";
const deckPath = resolve(__dirname, `${deckName}.html`);
const outputDir = resolve(__dirname, "exports", deckName);
const slideCount = 8;

mkdirSync(outputDir, { recursive: true });

for (let slide = 1; slide <= slideCount; slide += 1) {
  const padded = String(slide).padStart(2, "0");
  const outputPath = resolve(outputDir, `slide-${padded}.png`);
  const deckUrl = `file://${deckPath}?slide=${slide}`;
  const args = [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1080,1350",
    `--screenshot=${outputPath}`,
    deckUrl,
  ];

  console.log(`Exporting slide ${padded}...`);

  const result = spawnSync(chromePath, args, { encoding: "utf8" });

  if (result.status !== 0) {
    console.error(`Chrome exited with status=${result.status} signal=${result.signal}`);

    if (result.error) {
      console.error(result.error);
    }

    if (result.stdout) {
      console.error(result.stdout);
    }

    if (result.stderr) {
      console.error(result.stderr);
    }

    process.exit(result.status ?? 1);
  }
}

console.log(`Exported ${slideCount} slides to ${outputDir}`);
