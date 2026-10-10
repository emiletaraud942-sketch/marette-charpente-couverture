import playwright from "/opt/node-tools/node_modules/playwright/index.js";
const { chromium } = playwright;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
const base = "http://localhost:3000";
const resultats = [];

function verifier(label, condition) {
  resultats.push({ label, ok: Boolean(condition) });
}

try {
  await page.goto(`${base}/login`);
  verifier("page de login affichée", await page.locator("h1").textContent());

  await page.fill('input[name="email"]', "emiletaraud942@gmail.com");
  await page.fill('input[name="password"]', "00000000");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${base}/`, { timeout: 10000 });

  verifier("redirigé vers le tableau du jour après connexion", page.url() === `${base}/`);
  verifier(
    "le tableau du jour affiche Emile Taraud",
    (await page.locator("body").textContent())?.includes("Emile Taraud"),
  );

  // Créer un chantier
  await page.goto(`${base}/chantiers/nouveau`);
  await page.fill('input[name="nom"]', "Rénovation toiture Dupont");
  await page.fill('input[name="client"]', "M. Dupont");
  await page.fill('input[name="adresse"]', "12 rue des Lilas, Yvetot");
  const aujourdhui = new Date().toISOString().slice(0, 10);
  await page.fill('input[name="date_debut"]', aujourdhui);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/chantiers\/[0-9a-f-]+$/, { timeout: 10000 });
  verifier(
    "fiche chantier créée et affichée",
    (await page.locator("h1").textContent())?.includes("Rénovation toiture Dupont"),
  );
  const chantierUrl = page.url();

  // Créer un employé ouvrier
  await page.goto(`${base}/employes/nouveau`);
  await page.fill('input[name="prenom"]', "Jean");
  await page.fill('input[name="nom"]', "Dubois");
  await page.fill('input[name="telephone"]', "0600000000");
  await page.fill('input[name="email"]', "jean.dubois.test@example.com");
  await page.selectOption('select[name="role"]', "ouvrier");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/employes\/[0-9a-f-]+\?motDePasseTemporaire=/, { timeout: 10000 });
  verifier(
    "fiche employé créée avec mot de passe temporaire affiché",
    (await page.locator("body").textContent())?.includes("Mot de passe temporaire"),
  );
  const employeUrl = page.url();
  const employeId = employeUrl.match(/\/employes\/([0-9a-f-]+)\?/)?.[1];

  // Ajouter une habilitation avec échéance proche (pour tester le code couleur)
  const dansDixJours = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.selectOption('select[name="type"]', "caces");
  await page.fill('input[name="date_expiration"]', dansDixJours);
  await page.click('form:has(select[name="type"]) button[type="submit"]');
  await page.waitForTimeout(500);
  verifier(
    "habilitation ajoutée avec alerte orange (échéance proche)",
    (await page.locator(".bg-orange-100").count()) > 0,
  );

  // Affecter l'employé au chantier
  await page.goto(chantierUrl);
  await page.selectOption('select[name="employe_id"]', employeId);
  await page.fill('input[name="date_debut"]', aujourdhui);
  await page.click('button:has-text("Affecter")');
  await page.waitForTimeout(500);
  verifier(
    "équipe affectée visible sur la fiche chantier",
    (await page.locator("body").textContent())?.includes("Jean Dubois"),
  );

  // Vérifier le tableau du jour et le planning
  await page.goto(`${base}/`);
  verifier(
    "tableau du jour montre le chantier affecté à Jean Dubois",
    (await page.locator("body").textContent())?.includes("Rénovation toiture Dupont"),
  );

  await page.goto(`${base}/planning`);
  verifier(
    "planning hebdo montre l'affectation",
    (await page.locator("body").textContent())?.includes("Rénovation toiture Dupont"),
  );
} catch (err) {
  resultats.push({ label: `ERREUR: ${err.message}`, ok: false });
} finally {
  await browser.close();
}

console.log("\n--- Résultats du smoke test ---");
let echec = false;
for (const r of resultats) {
  console.log(`${r.ok ? "OK " : "ECHEC"} ${r.label}`);
  if (!r.ok) echec = true;
}
process.exit(echec ? 1 : 0);
