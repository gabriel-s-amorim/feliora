/**
 * Captura screenshots e vídeo demo da Feliora para o README de portfólio.
 *
 * Uso:
 *   npm run capture:install-browsers   # 1x
 *   # opcional: FELIORA_URL, FELIORA_ADMIN_EMAIL, FELIORA_ADMIN_PASSWORD
 *   npm run capture:screenshots
 *
 * Conversão manual do vídeo (se ffmpeg não estiver no PATH):
 *   ffmpeg -y -i docs/screenshots/demo.webm -vf "fps=10,scale=800:-1:flags=lanczos" -loop 0 docs/screenshots/demo.gif
 */

import { spawnSync } from "node:child_process";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Cookie, type Page } from "playwright";

const ROOT = process.cwd();
const BASE_URL = (process.env.FELIORA_URL || "https://www.feliora.com.br").replace(
  /\/$/,
  ""
);
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const VIDEO_DIR = path.join(OUT_DIR, "_video-tmp");
const VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

function adminCredentials() {
  return {
    email:
      process.env.FELIORA_ADMIN_EMAIL ||
      process.env.ADMIN_BOOTSTRAP_EMAIL ||
      "",
    password:
      process.env.FELIORA_ADMIN_PASSWORD ||
      process.env.ADMIN_BOOTSTRAP_PASSWORD ||
      "",
  };
}

function consentCookie(url: string): Cookie {
  const { hostname } = new URL(url);
  const value = encodeURIComponent(
    JSON.stringify({
      v: 1,
      essential: true,
      analytics: false,
      marketing: false,
      ts: Date.now(),
    })
  );
  return {
    name: "feliora_cookie_consent",
    value,
    domain: hostname,
    path: "/",
    expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    httpOnly: false,
    secure: url.startsWith("https"),
    sameSite: "Lax",
  };
}

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1_400);
  await page.evaluate(() => document.fonts.ready).catch(() => undefined);
}

async function dismissOverlays(page: Page) {
  const accept = page.getByRole("button", { name: /Aceitar todos/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click().catch(() => undefined);
    await page.waitForTimeout(300);
  }
}

async function screenshot(page: Page, name: string) {
  await dismissOverlays(page);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(120);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: false,
    animations: "disabled",
  });
  console.log(`  ✓ ${name}.png`);
}

async function findProductHref(page: Page): Promise<string | null> {
  await page.goto(`${BASE_URL}/catalogo`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOverlays(page);

  const href = await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>(
      'a[href^="/produto/"]'
    );
    return link?.getAttribute("href") ?? null;
  });
  return href;
}

async function addFirstVariantToCart(page: Page, productHref: string) {
  await page.goto(`${BASE_URL}${productHref}`, {
    waitUntil: "networkidle",
  });
  await settle(page);
  await dismissOverlays(page);

  // Ensure a size is selected (first available)
  const sizeButtons = page.locator("button").filter({
    hasText: /\(.+\)|Veste|P|M|G|Único/i,
  });
  const sizeCount = await sizeButtons.count();
  for (let i = 0; i < sizeCount; i++) {
    const btn = sizeButtons.nth(i);
    const disabled = await btn.isDisabled().catch(() => true);
    if (!disabled) {
      await btn.click().catch(() => undefined);
      break;
    }
  }

  const addBtn = page.getByRole("button", {
    name: /Adicionar ao carrinho/i,
  });
  await addBtn.first().waitFor({ state: "visible", timeout: 20_000 });

  const label = (await addBtn.first().innerText()).trim();
  if (/Esgotado/i.test(label)) {
    throw new Error(`Produto ${productHref} está esgotado — não dá para capturar carrinho com itens.`);
  }

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/cart") &&
        res.request().method() === "POST" &&
        res.status() < 500,
      { timeout: 20_000 }
    ),
    addBtn.first().click(),
  ]);

  if (!response.ok()) {
    const body = await response.text().catch(() => "");
    throw new Error(`Falha ao adicionar ao carrinho: HTTP ${response.status()} ${body}`);
  }

  await page
    .getByText(/Adicionado ao carrinho/i)
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => undefined);
  await page.waitForTimeout(800);

  // Confirm via API that the cart is not empty
  const count = await page.evaluate(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { cart?: { items?: unknown[] } };
    return Array.isArray(data.cart?.items) ? data.cart.items.length : 0;
  });
  if (count < 1) {
    throw new Error("Carrinho ainda vazio após POST /api/cart.");
  }
}

async function adminLogin(page: Page) {
  const { email, password } = adminCredentials();
  if (!email || !password) {
    console.warn(
      "  ⚠ Admin credentials missing (FELIORA_ADMIN_EMAIL / FELIORA_ADMIN_PASSWORD). Skipping admin screens beyond login."
    );
    return false;
  }

  await page.goto(`${BASE_URL}/admin/login`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);

  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 20_000 });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').fill(password);

  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 });
  await settle(page);
  return true;
}

async function captureCheckout(page: Page) {
  // Checkout exige cliente autenticado (redirect para /conta/entrar?next=/checkout).
  // Sem credenciais de cliente de teste no ambiente, capturamos o gate de auth —
  // comportamento real do fluxo, sem criar usuários em produção.
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOverlays(page);
  await page.waitForTimeout(800);
  await screenshot(page, "06-checkout");
}

async function captureStorefront(page: Page) {
  console.log("\n[loja]");

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOverlays(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await screenshot(page, "01-home");

  await page.goto(`${BASE_URL}/catalogo`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOverlays(page);
  await screenshot(page, "02-catalogo");

  const productHref = await findProductHref(page);
  if (!productHref) {
    throw new Error("Nenhum produto encontrado em /catalogo para captura.");
  }

  await page.goto(`${BASE_URL}${productHref}`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await dismissOverlays(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await screenshot(page, "03-produto");

  await page.goto(`${BASE_URL}/carrinho`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOverlays(page);
  await screenshot(page, "05-carrinho-vazio");

  await addFirstVariantToCart(page, productHref);

  await page.goto(`${BASE_URL}/carrinho`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await dismissOverlays(page);
  await screenshot(page, "04-carrinho");

  // Com item no carrinho, /checkout redireciona para login se anônimo
  await captureCheckout(page);

  await page.goto(`${BASE_URL}/conta/entrar`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await dismissOverlays(page);
  await screenshot(page, "07-conta-entrar");

  return productHref;
}

async function captureAdmin(page: Page) {
  console.log("\n[admin]");

  await page.goto(`${BASE_URL}/admin/login`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  // Empty form — no credentials on screen
  await screenshot(page, "08-admin-login");

  const ok = await adminLogin(page);
  if (!ok) return;

  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await screenshot(page, "09-admin-dashboard");

  await page.goto(`${BASE_URL}/admin/produtos`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await screenshot(page, "10-admin-produtos");

  const importBtn = page.getByRole("button", {
    name: /Importar do TikTok|TikTok/i,
  });
  if (await importBtn.first().isVisible().catch(() => false)) {
    await importBtn.first().click();
    await page
      .getByLabel(/Importar do TikTok/i)
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => undefined);
    await page.waitForTimeout(600);
    await screenshot(page, "11-admin-import-tiktok");
    await page
      .getByLabel(/Importar do TikTok/i)
      .getByLabel(/Fechar/i)
      .click()
      .catch(() => undefined);
  } else {
    console.warn("  ⚠ Botão Importar do TikTok não encontrado");
  }

  await page.goto(`${BASE_URL}/admin/pedidos`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await screenshot(page, "12-admin-pedidos");
}

async function captureMobileHome(contextFactory: () => Promise<BrowserContext>) {
  console.log("\n[mobile]");
  const context = await contextFactory();
  await context.addCookies([consentCookie(BASE_URL)]);
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await dismissOverlays(page);
    await screenshot(page, "13-home-mobile");
  } finally {
    await context.close();
  }
}

async function recordDemo(productHref: string) {
  console.log("\n[vídeo demo]");
  await rm(VIDEO_DIR, { recursive: true, force: true });
  await mkdir(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  });
  await context.addCookies([consentCookie(BASE_URL)]);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await dismissOverlays(page);
    await page.waitForTimeout(800);

    await page.goto(`${BASE_URL}${productHref}`, {
      waitUntil: "domcontentloaded",
    });
    await settle(page);
    await page.waitForTimeout(800);

    const addBtn = page.getByRole("button", {
      name: /Adicionar ao carrinho/i,
    });
    if (await addBtn.first().isVisible().catch(() => false)) {
      await addBtn.first().click().catch(() => undefined);
      await page.waitForTimeout(800);
    }

    await page.goto(`${BASE_URL}/carrinho`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(700);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(900);

    await page.goto(`${BASE_URL}/admin/login`, {
      waitUntil: "domcontentloaded",
    });
    await settle(page);
    await page.waitForTimeout(1_000);

    const creds = adminCredentials();
    if (creds.email && creds.password) {
      await page.locator('input[type="email"]').fill(creds.email);
      await page.locator('input[type="password"]').fill(creds.password);
      await page.getByRole("button", { name: /^Entrar$/ }).click();
      await page
        .waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 })
        .catch(() => undefined);
      await settle(page);
      await page.waitForTimeout(1_200);
    }
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  const files = await readdir(VIDEO_DIR);
  const webm = files.find((f) => f.endsWith(".webm"));
  if (!webm) {
    console.warn("  ⚠ Nenhum .webm gerado");
    return;
  }
  const destWebm = path.join(OUT_DIR, "demo.webm");
  await rename(path.join(VIDEO_DIR, webm), destWebm);
  await rm(VIDEO_DIR, { recursive: true, force: true });
  console.log("  ✓ demo.webm");

  const ffmpeg = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      destWebm,
      "-vf",
      "fps=10,scale=800:-1:flags=lanczos",
      "-loop",
      "0",
      path.join(OUT_DIR, "demo.gif"),
    ],
    { encoding: "utf8" }
  );
  if (ffmpeg.status === 0) {
    console.log("  ✓ demo.gif");
  } else {
    console.warn(
      "  ⚠ ffmpeg indisponível ou falhou. Converta manualmente:\n" +
        '     ffmpeg -y -i docs/screenshots/demo.webm -vf "fps=10,scale=800:-1:flags=lanczos" -loop 0 docs/screenshots/demo.gif'
    );
  }
}

async function loadEnvLocal() {
  try {
    const { readFileSync } = await import("node:fs");
    const raw = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env) || !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local opcional
  }
}

async function main() {
  await loadEnvLocal();

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Capturando contra ${BASE_URL}`);
  console.log(`Saída: ${OUT_DIR}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await context.addCookies([consentCookie(BASE_URL)]);
  const page = await context.newPage();
  page.on("pageerror", (error) => console.error("[browser]", error.message));

  let productHref = "/catalogo";
  try {
    productHref = (await captureStorefront(page)) ?? productHref;
    await captureAdmin(page);
  } finally {
    await context.close();
    await browser.close();
  }

  await captureMobileHome(async () =>
    chromium.launch().then((b) =>
      b.newContext({
        viewport: MOBILE_VIEWPORT,
        deviceScaleFactor: 2,
        colorScheme: "light",
        reducedMotion: "reduce",
        isMobile: true,
        hasTouch: true,
      }).then(async (ctx) => {
        // Attach browser close to context close
        const origClose = ctx.close.bind(ctx);
        ctx.close = async () => {
          await origClose();
          await b.close();
        };
        return ctx;
      })
    )
  );

  await recordDemo(productHref);

  await writeFile(
    path.join(OUT_DIR, "capture.json"),
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        viewport: VIEWPORT,
        mobileViewport: MOBILE_VIEWPORT,
        capturedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("\nConcluído.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
