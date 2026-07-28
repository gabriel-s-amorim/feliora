const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const pubImages = path.join(root, "public", "images");
const appDir = path.join(root, "src", "app");
const publicDir = path.join(root, "public");

const legacyJpg = path.join(pubImages, "logo-feliora-legacy.jpg");
const newPngSrc = process.argv[2];
const logoOut = path.join(pubImages, "logo-feliora.png");
const logoOg = path.join(pubImages, "og-feliora.png");

async function removeNearBlack(inputPath) {
  const raw = sharp(inputPath);
  const { data, info } = await raw
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // preto / cinza muito escuro sem saturação → transparente
    if (max < 48 || (max < 70 && max - min < 12)) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png();
}

async function withCreamBg(inputBuffer, size, out) {
  await sharp(inputBuffer)
    .resize(size, size, {
      fit: "contain",
      background: { r: 253, g: 248, b: 244, alpha: 1 },
    })
    .flatten({ background: { r: 253, g: 248, b: 244 } })
    .png()
    .toFile(out);
}

async function main() {
  if (!newPngSrc || !fs.existsSync(newPngSrc)) {
    throw new Error("Informe o caminho da nova logo PNG");
  }
  if (!fs.existsSync(legacyJpg)) {
    const currentJpg = path.join(pubImages, "logo-feliora.jpg");
    if (fs.existsSync(currentJpg)) fs.copyFileSync(currentJpg, legacyJpg);
  }

  const transparentLogo = await removeNearBlack(newPngSrc);
  await transparentLogo.toFile(logoOut);

  // OG: logo transparente sobre cream
  const logoForOg = await sharp(logoOut)
    .resize(520, 520, {
      fit: "contain",
      background: { r: 253, g: 248, b: 244, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 253, g: 248, b: 244 },
    },
  })
    .composite([{ input: logoForOg, gravity: "centre" }])
    .png()
    .toFile(logoOg);

  // Favicon: emblema da logo ATUAL (legado) — só a área do F + flor
  const meta = await sharp(legacyJpg).metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;
  const side = Math.floor(Math.min(w, h) * 0.58);
  const left = Math.floor((w - side) / 2);
  const top = Math.floor(h * 0.04);

  const emblem = await sharp(legacyJpg)
    .extract({ left, top, width: side, height: side })
    .png()
    .toBuffer();

  await withCreamBg(emblem, 32, path.join(appDir, "icon.png"));
  await withCreamBg(emblem, 180, path.join(appDir, "apple-icon.png"));
  await withCreamBg(emblem, 180, path.join(publicDir, "apple-icon.png"));
  await withCreamBg(emblem, 32, path.join(publicDir, "favicon-32.png"));
  await withCreamBg(emblem, 192, path.join(publicDir, "icon-192.png"));
  await withCreamBg(emblem, 512, path.join(publicDir, "icon-512.png"));
  fs.copyFileSync(path.join(appDir, "icon.png"), path.join(publicDir, "favicon.ico"));

  const outMeta = await sharp(logoOut).metadata();
  console.log(
    JSON.stringify({
      logo: { width: outMeta.width, height: outMeta.height, hasAlpha: outMeta.hasAlpha },
      crop: { left, top, side },
      ok: true,
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
