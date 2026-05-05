// ==========================================================
// -V9  Konekcija sa SQLite bazom podataka
// ==========================================================
// Promjene u odnosu na v5:
//   1. Baza se NE nalazi vise u v5/ vec u ROOT-u repozitorija
//      (jedan nivo iznad v9/). Tako mogu i v5 i v9 (i naredne
//      vjezbe) dijeliti istu bazu.
//   2. Dodali smo NOVU tabelu `predmet` (jednostavna tabela)
//   3. Dodali smo SPOJNU tabelu `student_predmet` koja
//      realizuje N:M vezu (student moze slusati VISE predmeta,
//      a predmet moze imati VISE studenata).

const Database = require("better-sqlite3");
const path = require("path");

// __dirname = folder u kojem je ovaj fajl (v9/).
// "..", "skola.db" => fajl iz roditeljskog foldera (root projekta).
const dbPath = path.join(__dirname, "..", "skola.db");
const db = new Database(dbPath);

// SQLite po defaultu NE provjerava strane kljuceve — moramo rucno ukljuciti.
db.pragma("foreign_keys = ON");

// --------------------- KREIRANJE TABELA ---------------------
// "CREATE TABLE IF NOT EXISTS" — ako tabela vec postoji (jer smo je
// napravili u v5), nista se nece dogoditi. Samo nove tabele
// (predmet, student_predmet) ce biti dodane.
//
// TABELA: grupa     (vec iz v5)
// TABELA: student   (vec iz v5)
//
// NOVO U V9:
//
// TABELA: predmet
//   - id      -> primarni kljuc
//   - naziv   -> ime predmeta (npr. "Razvoj web aplikacija"), UNIQUE
//   - ects    -> broj ECTS bodova
//
// TABELA: student_predmet  (SPOJNA / JUNCTION tabela za N:M vezu)
//   - student_id   -> FK na student.id
//   - predmet_id   -> FK na predmet.id
//   - ocjena       -> 5..10 (ili NULL ako student jos nije ocijenjen)
//   - PRIMARY KEY (student_id, predmet_id) -> SLOZENI primarni kljuc
//      => isti student NE moze biti dvaput upisan na isti predmet
//   - ON DELETE CASCADE -> ako obrisemo studenta ili predmet,
//      automatski se brisu i upisi u spojnoj tabeli (inace bi nam
//      ostali "siroti" redovi koji pokazuju u prazno)
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
`);

// ----------------------- SEED DATA -----------------------
// Ako je tabela grupa prazna, ubaci pocetne grupe.
const brojGrupa = db.prepare("SELECT COUNT(*) AS cnt FROM grupa").get().cnt;
if (brojGrupa === 0) {
  const insert = db.prepare("INSERT INTO grupa (naziv, godina) VALUES (?, ?)");
  insert.run("Informatika 1", 1);
  insert.run("Informatika 2", 2);
  insert.run("Matematika 1", 1);
  console.log("[db] Ubacene pocetne grupe.");
}

// Ako je tabela predmet prazna, ubaci pocetne predmete.
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
