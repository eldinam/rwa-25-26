// ==========================================================
// VJEZBA: CLI alat za analizu studenata
// ==========================================================
//
// Pokretanje:
//   node analiza.js <komanda> [argumenti...]
//
// Podrzane komande:
//   prosjek                -> prosjecna ocjena svih studenata
//   top <N>                -> top N studenata po prosjeku
//   po-grupama             -> broj studenata po grupama
//   trazi <ime>            -> filtriraj studente po imenu
//   export <putanja>       -> snimi obradjene podatke u JSON fajl
//
// Primjeri:
//   node analiza.js prosjek
//   node analiza.js top 5
//   node analiza.js po-grupama
//   node analiza.js trazi Ana
//   node analiza.js export rezultati.json
//
// SAVJET: koristi moderne JS metode (map, filter, reduce, find).
// Sve sto trebas je u PDF skripti "Moderni JavaScript za Node.js".

// ---- UVOZI ----
// TODO 1: Ucitaj ugradjene module 'fs' i 'path' preko require().
//         Trebamo 'fs' za citanje/pisanje fajlova, 'path' za putanju.
const fs = null;   // <-- zamijeni 'null' sa require("fs")
const path = null; // <-- zamijeni 'null' sa require("path")

// ---- UCITAVANJE PODATAKA ----
// TODO 2: Sastavi apsolutnu putanju do fajla "studenti.json".
//         Koristi path.join(__dirname, ...) — __dirname je folder
//         u kojem je ovaj fajl.
const putanja = null; // <-- npr. path.join(__dirname, "studenti.json")

// TODO 3: Procitaj fajl sinhrono (fs.readFileSync) sa enkodiranjem "utf8"
//         i pretvori JSON string u JS niz (JSON.parse).
const studenti = []; // <-- popuni iz fajla

// ---- POMOCNE FUNKCIJE ----

// Vraca prosjek niza brojeva.
// TODO 4: Koristi reduce() da sumiras ocjene, pa podijeli sa length.
//         Razmisli: sta vratiti ako je niz prazan? (vrati 0)
function prosjekOcjena(ocjene) {
  // npr: return ocjene.reduce((s, o) => s + o, 0) / ocjene.length;
  return 0;
}

// Dodaje "prosjek" polje svakom studentu (ne mutira original).
// TODO 5: Koristi map() i spread (...) da napravis novi niz studenata,
//         pri cemu svaki ima dodato polje "prosjek".
//         Primjer: { ...student, prosjek: prosjekOcjena(student.ocjene) }
function saProsjekom(studenti) {
  return studenti;
}

// ---- KOMANDE ----

function komandaProsjek() {
  // TODO 6: Izracunaj ukupni prosjek SVIH ocjena (ne prosjek prosjeka!).
  //         Hint: napravi jedan veliki niz svih ocjena uz pomoc reduce-a,
  //               ili .flatMap(s => s.ocjene), pa nadji prosjek.
  console.log("TODO: ukupan prosjek");
}

function komandaTop(n) {
  // TODO 7: Sortiraj studente po prosjeku (od najveceg ka najmanjem)
  //         i uzmi prvih N. Ispisi tabelu u terminal.
  //
  //         Hint: .sort((a, b) => b.prosjek - a.prosjek).slice(0, n)
  //
  //         Za ispis koristi template literale, npr:
  //         console.log(`${index + 1}. ${ime} ${prezime} — ${prosjek.toFixed(2)}`);
  console.log(`TODO: top ${n}`);
}

function komandaPoGrupama() {
  // TODO 8: Grupisi studente po polju "grupa" i ispisi broj studenata
  //         za svaku grupu.
  //
  //         Hint: reduce() sa pocetnim {} objektom — vidi PDF, poglavlje
  //         o reduce(). Akumulator = objekat { "Grupa A": 5, "Grupa B": 3 }
  console.log("TODO: po grupama");
}

function komandaTrazi(upit) {
  // TODO 9: Filtriraj studente cije ime ILI prezime sadrzi `upit`
  //         (case-insensitive). Ispisi rezultate.
  //
  //         Hint: .filter(s => s.ime.toLowerCase().includes(upit.toLowerCase()))
  console.log(`TODO: trazi "${upit}"`);
}

function komandaExport(izlazFajl) {
  // TODO 10: Napravi listu objekata { ime, prezime, grupa, prosjek }
  //          i snimi u JSON fajl na zadatu putanju (fs.writeFileSync).
  //          Koristi JSON.stringify sa 2 razmaka za "lijep" format:
  //          JSON.stringify(podaci, null, 2)
  console.log(`TODO: export -> ${izlazFajl}`);
}

// ---- DISPATCHER ----
// process.argv = [node, putanja_do_skripte, ...argumenti]
// slice(2) preskace prva dva da dobijemo samo argumente.

// TODO 11: Izvuci prvi argument kao komandu, ostalo kao parametre.
//          Koristi destrukturiranje niza:
//          const [komanda, ...args] = process.argv.slice(2);
const [komanda, ...args] = [];

// TODO 12: Switch-case za biranje komande. Ako komanda nije poznata,
//          ispisi help poruku (sve dostupne komande).
switch (komanda) {
  case "prosjek":
    komandaProsjek();
    break;

  // TODO: ostali case-ovi

  default:
    console.log("Dostupne komande: prosjek, top <N>, po-grupama, trazi <ime>, export <putanja>");
    console.log("Primjer: node analiza.js top 3");
}
