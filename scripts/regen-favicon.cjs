const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function main() {
  const root = path.join(__dirname, "..");
  const src = path.join(root, "public", "images", "logo-feliora-legacy.jpg");
  const pub = path.join(root, "public");
  const app = path.join(root, "src", "app");

  const meta = await sharp(src).metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;
  const side = Math.floor(Math.min(w, h) * 0.58);
  const left = Math.floor((w - side) / 2);
  const top = Math.floor(h * 0.04);

  const emblem = await sharp(src)
    .extract({ left, top, width: side, height: side })
    .png()
    .toBuffer();

  async function mk(size, out) {
    await sharp(emblem)
      .resize(size, size, {
        fit: "contain",
        background: { r: 253, g: 248, b: 244, alpha: 1 },
      })
      .flatten({ background: { r: 253, g: 248, b: 244 } })
      .png()
      .toFile(out);
  }

  await mk(32, path.join(pub, "favicon-32.png"));
  await mk(48, path.join(app, "icon.png"));
  await mk(180, path.join(app, "apple-icon.png"));
  await mk(180, path.join(pub, "apple-icon.png"));
  await mk(192, path.join(pub, "icon-192.png"));
  await mk(512, path.join(pub, "icon-512.png"));

  // Chrome ainda pede /favicon.ico — servi PNG válido (sniff de conteúdo)
  fs.copyFileSync(
    path.join(pub, "favicon-32.png"),
    path.join(pub, "favicon.ico")
  );

  console.log("favicon assets ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
