// ==========================================================
// VJEZBA: CLI alat za analizu studenata — RJESENJE
// ==========================================================
// FAJL NAMIJENJEN INSTRUKTORU. Studenti ne treba da ga dobiju
// prije nego sto sami pokusaju.
//
// Pokretanje:
//   node analiza-rjesenje.js prosjek
//   node analiza-rjesenje.js top 5
//   node analiza-rjesenje.js po-grupama
//   node analiza-rjesenje.js trazi Ana
//   node analiza-rjesenje.js export rezultati.json

const fs = require("fs");
const path = require("path");

// Ucitaj podatke
const putanja = path.join(__dirname, "studenti.json");
const studenti = JSON.parse(fs.readFileSync(putanja, "utf8"));

// ---- POMOCNE ----
const prosjekOcjena = (ocjene) =>
  ocjene.length === 0 ? 0 : ocjene.reduce((s, o) => s + o, 0) / ocjene.length;

const saProsjekom = (lista) =>
  lista.map((s) => ({ ...s, prosjek: prosjekOcjena(s.ocjene) }));

// ---- KOMANDE ----

function komandaProsjek() {
  // flatMap razvuce sve "ocjene" nizove u jedan veliki niz brojeva
  const sveOcjene = studenti.flatMap((s) => s.ocjene);
  const p = prosjekOcjena(sveOcjene);
  console.log(`Ukupan prosjek (${sveOcjene.length} ocjena): ${p.toFixed(2)}`);
}

function komandaTop(n) {
  const broj = Number(n) || 3;
  const top = saProsjekom(studenti)
    .sort((a, b) => b.prosjek - a.prosjek)
    .slice(0, broj);

  console.log(`Top ${broj} studenata po prosjeku:`);
  top.forEach((s, i) => {
    console.log(
      `  ${i + 1}. ${s.ime} ${s.prezime} (${s.grupa}) — ${s.prosjek.toFixed(2)}`,
    );
  });
}

function komandaPoGrupama() {
  const brojPoGrupi = studenti.reduce((acc, s) => {
    acc[s.grupa] = (acc[s.grupa] ?? 0) + 1;
    return acc;
  }, {});

  console.log("Broj studenata po grupama:");
  // Object.entries(obj) -> [[kljuc, vrijednost], ...]
  Object.entries(brojPoGrupi).forEach(([grupa, broj]) => {
    console.log(`  ${grupa}: ${broj}`);
  });
}

function komandaTrazi(upit = "") {
  const q = upit.toLowerCase();
  const nadjeni = studenti.filter(
    (s) =>
      s.ime.toLowerCase().includes(q) || s.prezime.toLowerCase().includes(q),
  );

  if (nadjeni.length === 0) {
    console.log(`Nema rezultata za "${upit}".`);
    return;
  }

  console.log(`Rezultati za "${upit}" (${nadjeni.length}):`);
  nadjeni.forEach((s) => {
    console.log(`  - ${s.ime} ${s.prezime} (${s.grupa})`);
  });
}

function komandaExport(izlazFajl = "rezultati.json") {
  const podaci = saProsjekom(studenti).map(({ ime, prezime, grupa, prosjek }) => ({
    ime,
    prezime,
    grupa,
    prosjek: Number(prosjek.toFixed(2)),
  }));

  const izlazPutanja = path.join(__dirname, izlazFajl);
  fs.writeFileSync(izlazPutanja, JSON.stringify(podaci, null, 2), "utf8");
  console.log(`Snimljeno ${podaci.length} zapisa u ${izlazPutanja}`);
}

// ---- DISPATCHER ----
const [komanda, ...args] = process.argv.slice(2);

switch (komanda) {
  case "prosjek":
    komandaProsjek();
    break;
  case "top":
    komandaTop(args[0]);
    break;
  case "po-grupama":
    komandaPoGrupama();
    break;
  case "trazi":
    komandaTrazi(args[0]);
    break;
  case "export":
    komandaExport(args[0]);
    break;
  default:
    console.log("Dostupne komande:");
    console.log("  prosjek                -> prosjecna ocjena svih");
    console.log("  top <N>                -> top N po prosjeku");
    console.log("  po-grupama             -> broj studenata po grupama");
    console.log("  trazi <ime>            -> filtriraj po imenu/prezimenu");
    console.log("  export <putanja.json>  -> snimi obradjene podatke u fajl");
    console.log("\nPrimjer: node analiza-rjesenje.js top 3");
}
