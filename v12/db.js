// ==========================================================
// -V12 Konekcija sa SQLite bazom podataka
// ==========================================================
// Sve iz v5/v9/v10 ostaje. NOVO U V12:
//   - tabela `zadatak` -> jednostavna "to-do" lista vezana za korisnika.
//
// CILJ V12: pokazati AJAX CRUD (fetch + JSON) na NOVOJ, MALOJ tabeli
// koja se ne mijesa sa postojecim "student/predmet" sistemom.
// Tako studenti imaju CIST primjer "moderne" CRUD price bez
// distraktora iz N:M veza, JOIN-ova itd.

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "skola.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// --------------------- KREIRANJE TABELA ---------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS grupa (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    naziv   TEXT NOT NULL,
    godina  INTEGER NOT NULL
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

  CREATE TABLE IF NOT EXISTS predmet (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    naziv  TEXT NOT NULL UNIQUE,
    ects   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS student_predmet (
    student_id  INTEGER NOT NULL,
    predmet_id  INTEGER NOT NULL,
    ocjena      INTEGER,
    PRIMARY KEY (student_id, predmet_id),
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (predmet_id) REFERENCES predmet(id) ON DELETE CASCADE
  );

  -- -V10 tabela korisnik (login/registracija)
  CREATE TABLE IF NOT EXISTS korisnik (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    korisnicko_ime      TEXT NOT NULL UNIQUE,
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    datum_registracije  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- -V12 NOVO: tabela zadatak (to-do lista)
  --   - naslov        -> kratak naslov zadatka, obavezan
  --   - opis          -> duzi opis (opciono)
  --   - uradjeno      -> 0 ili 1 (SQLite nema pravi BOOLEAN, koristimo INTEGER)
  --   - rok           -> datum do kad zadatak treba zavrsiti (TEXT u ISO formatu)
  --   - korisnik_id   -> FK na korisnik(id) - svaki korisnik ima SVOJU listu
  --   - datum_kreiranja -> automatski timestamp
  --
  -- ON DELETE CASCADE: ako se korisnik obrise, brisu se i njegovi zadaci.
  CREATE TABLE IF NOT EXISTS zadatak (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    naslov            TEXT NOT NULL,
    opis              TEXT,
    uradjeno          INTEGER NOT NULL DEFAULT 0,
    rok               TEXT,
    korisnik_id       INTEGER NOT NULL,
    datum_kreiranja   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (korisnik_id) REFERENCES korisnik(id) ON DELETE CASCADE
  );
`);

// ----------------------- SEED DATA -----------------------
const brojGrupa = db.prepare("SELECT COUNT(*) AS cnt FROM grupa").get().cnt;
if (brojGrupa === 0) {
  const insert = db.prepare("INSERT INTO grupa (naziv, godina) VALUES (?, ?)");
  insert.run("Informatika 1", 1);
  insert.run("Informatika 2", 2);
  insert.run("Matematika 1", 1);
  console.log("[db] Ubacene pocetne grupe.");
}

const brojPredmeta = db.prepare("SELECT COUNT(*) AS cnt FROM predmet").get().cnt;
if (brojPredmeta === 0) {
  const insert = db.prepare("INSERT INTO predmet (naziv, ects) VALUES (?, ?)");
  insert.run("Razvoj web aplikacija", 6);
  insert.run("Baze podataka", 6);
  insert.run("Algoritmi i strukture podataka", 5);
  insert.run("Operativni sistemi", 5);
  console.log("[db] Ubaceni pocetni predmeti.");
}

console.log("[db] Baza spremna:", dbPath);

module.exports = db;
