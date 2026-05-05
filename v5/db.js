// ==========================================================
// -V5  NOVI FAJL — konekcija sa SQLite bazom podataka
// ==========================================================
// Ovaj modul radi tri stvari:
//   1. Otvori (ili kreira) fajl "skola.db" u v5 folderu
//   2. Napravi tabele ako jos ne postoje (CREATE TABLE IF NOT EXISTS)
//   3. Izveze (export) 'db' objekat da ga rute mogu koristiti

// "better-sqlite3" je biblioteka koja omogucava Node.js-u
// da prica sa SQLite bazom. Radi SINKRONO (bez callback-a
// i promise-a) sto je super jednostavno za pocetnike.
const Database = require("better-sqlite3");
const path = require("path");

// __dirname = apsolutna putanja do foldera u kojem je ovaj fajl (v5/).
// Baza je u ROOT-u repozitorija (jedan nivo iznad v5/), tako da je
// MOZEMO DIJELITI izmedju v5, v9 i narednih vjezbi.
// Ako fajl ne postoji, better-sqlite3 ce ga napraviti automatski.
const dbPath = path.join(__dirname, "..", "skola.db");
const db = new Database(dbPath);

// Ukljuci provjeru stranih kljuceva (FOREIGN KEY).
// SQLite to po defaultu NE provjerava — moramo rucno ukljuciti.
db.pragma("foreign_keys = ON");

// --------------------- KREIRANJE TABELA ---------------------
// db.exec() izvrsava SQL koji ne vraca podatke (CREATE, DROP...).
//
// TABELA: grupa
//   - id          -> primarni kljuc, automatski raste (AUTOINCREMENT)
//   - naziv       -> obavezan tekst (NOT NULL)
//   - godina      -> broj (1, 2, 3, 4)
//
// TABELA: student
//   - id          -> primarni kljuc
//   - ime         -> tekst, obavezno
//   - prezime     -> tekst, obavezno
//   - email       -> tekst, mora biti JEDINSTVEN (UNIQUE) — nema duplih
//   - broj_indeksa-> tekst, obavezan i jedinstven
//   - grupa_id    -> veza ka tabeli grupa (FOREIGN KEY)

db.exec(`
  CREATE TABLE IF NOT EXISTS grupa (
    id      INTEGER  PRIMARY KEY AUTOINCREMENT,
    naziv   TEXT     NOT NULL,
    godina  INTEGER  NOT NULL
  );

  CREATE TABLE IF NOT EXISTS student (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ime            TEXT NOT NULL,
    prezime        TEXT NOT NULL,
    email          TEXT UNIQUE,
    broj_indeksa   TEXT UNIQUE NOT NULL,
    grupa_id       INTEGER,
    FOREIGN KEY (grupa_id) REFERENCES grupa(id)
  );
`);

// Mali "seed" — ako je tabela grupa prazna, ubaci par grupa
// da studenti imaju sta birati iz dropdown-a.
const brojGrupa = db.prepare("SELECT COUNT(*) AS cnt FROM grupa").get().cnt;
if (brojGrupa === 0) {
  const insert = db.prepare("INSERT INTO grupa (naziv, godina) VALUES (?, ?)");
  insert.run("Informatika 1", 1);
  insert.run("Informatika 2", 2);
  insert.run("Matematika 1", 1);
  console.log("[db] Ubacene pocetne grupe.");
}

console.log("[db] Baza spremna:", dbPath);

// Izvezi db objekat — rute ce ga importovati i pozivati db.prepare(...).
module.exports = db;
