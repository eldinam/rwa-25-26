# Projekat: Putovanja

**Razvoj web aplikacija**
2025/2026
Prirodno-matematički fakultet
Univerzitet u Sarajevu

---

## Uvod

Kreirati sistem koji će se koristiti za evidenciju putovanja na kojima je korisnik bio, te budućih putovanja na koja korisnik želi otići. Isti sistem koristi agencija za putovanja. Agencija nudi korisnicima putovanja na određene lokacije, ali daje mogućnost i korisnicima da sami izaberu mjesto gdje žele putovati. U specifikacijama su navedene smjernice šta sistem treba da sadrži.

---

## Tehnologije

- **Backend:** Node.js + Express
- **View engine / Frontend:** **obavezno EJS** (server-rendered), uz vanilla JavaScript na klijentskoj strani. Nije dozvoljeno koristiti React, Vue, Angular, Svelte ili bilo koji drugi SPA/frontend framework.
- **Baza podataka:** SQLite preko `better-sqlite3` (kao na vježbama) ili PostgreSQL/MySQL — student definiše šemu na osnovu specifikacija.
- **Mape:** [Leaflet](https://leafletjs.com/) + OpenStreetMap pločice (besplatno, bez API ključa). Alternativa: Mapbox GL JS ili Google Maps JS API (zahtijevaju ključ).
- **Autentifikacija:** `express-session` + `bcrypt` za heširanje lozinki.
- **Email (zaboravljena lozinka):** `nodemailer` (SMTP) ili lokalni "fake mailer" koji ispiše poruku u konzolu za potrebe demonstracije.
- **PDF generisanje:** `pdfkit` ili `puppeteer`.

---

## Specifikacije

### Prijava / Registracija

- Ukoliko korisnik nije prijavljen na stranicu, preusmjerava se na Login stranicu. Korisnik unosi korisničko ime, id ili e-mail, te lozinku.
- **Dugme "Prijavi se"**
  - provjerava se da li je korisnik sa unesenim korisničkim imenom i lozinkom registrovan, te ukoliko jeste, otvara se početna strana;
  - ako korisnik nije registrovan, prikaže se odgovarajuća poruka;
  - polje "korisničko ime" i polje "lozinka" ne smiju biti prazni.
- **Dugme "Registruj se"** — otvara se forma u kojoj je potrebno upisati:
  - ime, prezime, korisničko ime, e-mail, lozinku i ponovljenu lozinku, ako se radi o osobi;
  - naziv agencije, id, e-mail, datum osnivanja, lozinka i ponovljena lozinka, ako se radi o agenciji;
  - provjerava se da li je već registrovan korisnik/agencija pod datim korisničkim imenom ili e-mail adresom;
  - ukoliko postoji korisnik, ispisati odgovarajuću poruku;
  - ukoliko je novi korisnik, spašava se u bazu (lozinka **mora** biti heširana pomoću `bcrypt`) i vodi korisnika na početnu stranicu;
  - polja: korisničko ime, id, e-mail, lozinka i ponovljena lozinka su obavezna polja za unos.
- **Zaboravljena lozinka**
  - korisniku/agenciji se nudi opcija da vrati zaboravljenu lozinku;
  - ukoliko je uneseni e-mail registrovan u bazi podataka, na taj e-mail se šalje poruka sa novom lozinkom (u bazi je potrebno kreirati novu, heširanu lozinku za datog korisnika/agenciju).

### Sistem treba da sadrži sljedeće elemente (student bira kako će rasporediti te elemente)

- **Početna stranica**
  - prikazana je **Leaflet** mapa sa svim destinacijama u posljednjih mjesec dana (markeri se učitavaju iz baze kao GeoJSON preko Express endpoint-a);
  - dropdown sa završenim putovanjima;
  - odabirom nekog putovanja, prikazuje se mapa mjesta koje je posjećeno.
- **Moja putovanja**
  - stranica prikazuje sva putovanja na koja je korisnik išao ili u slučaju agencije, prikazuje sva organizovana putovanja;
  - prikazati kao listu: naslov, slika, kratak opis, datum putovanja, tip putovanja (samostalno ili organizovano), prevoz koji je korišten (ako je bilo više vrsta prevoza, navesti ih sve)...;
  - sortirati putovanja.
- **Planirana putovanja**
  - prikazana je lista budućih putovanja na koja se korisnik prijavio ili poslao zahtjev agenciji za novo putovanje;
  - u slučaju agencije, prikazana su sva planirana putovanja na koja se korisnici mogu prijaviti kao i zahtjevi za putovanja od korisnika;
  - razlikovati putovanja na čekanju, odobrena i odbijena;
  - korisnici i agencije mogu brisati planirana putovanja;
  - sortirati putovanja.
- **Dodaj / Prijavi se na putovanje**
  - korisnik se može prijaviti na neko već postojeće putovanje koje je agencija isplanirala u budućnosti (sve agencije koje su registrovane u sistemu);
  - korisnik može napraviti novo putovanje, gdje bira agenciju preko koje želi putovati, mjesto (klikom na Leaflet mapu se uzima `lat/lng`), vrijeme, prevoz i maksimalnu cijenu koju bi platio agenciji za to putovanje (ako su potrebne još neke informacije, student može dodati);
  - agencija može napraviti novo putovanje na koje se korisnici mogu prijaviti. Prilikom planiranja putovanja, potrebno je navesti maksimalan i minimalan broj prijavljenih korisnika da bi se putovanje desilo.
- **Postavke**
  - korisnik / agencija
    - prikazati osnovne informacije o korisniku ili agenciji;
    - omogućiti promjenu nekih informacija (korisničko ime i e-mail se ne mogu mijenjati).
  - student
    - prikazati osnovne informacije o studentu koji je radio na sistemu;
    - informacije o predmetu.
- **Dugme za odjavljivanje sa sistema** — kada se korisnik/agencija odjavi sa sistema prikaže se Login stranica.
- U projektu je potrebno prikazati naziv sistema, logo agencije ili slika korisnika, te registrovani korisnik ili agencija. Ove informacije trebaju biti vidljive iz svakog dijela sistema.

---

## Dodatne specifikacije

- **Stil**
  - Omogućiti korisniku da promijeni boje stranice;
  - Ponuditi 2 opcije: Tamna i Svijetla;
  - Svijetla se prikazuje na početku.
- Na početnoj stranici omogućiti klik na mapu. Klikom na mapu na neko mjesto moguće je kreirati novo putovanje (korisnik ili agencija).
- Omogućiti pretragu u "Moja putovanja" i "Planirana putovanja".
- Generisanje PDF dokumenata za pojedinačno putovanje (`pdfkit` ili `puppeteer`).
- **Dijeljenje putovanja linkom (NOVO)**
  - Svako putovanje mora imati mogućnost dijeljenja javnim linkom sa prijateljima koji nisu registrovani u sistemu.
  - Dugme "Podijeli" na stranici pojedinačnog putovanja generiše jedinstveni token (npr. `crypto.randomBytes(16).toString('hex')`) i sprema ga u tabelu putovanja kao `share_token`.
  - Ruta `GET /share/:token` javno (bez prijave) prikazuje osnovne informacije o putovanju: naslov, datum, destinaciju na mapi, kratki opis, sliku. Ne prikazuje osjetljive podatke (cijena, lični podaci, spisak prijavljenih korisnika).
  - Korisnik mora imati mogućnost da uključi/isključi dijeljenje (polje `is_public` u bazi) ili da regeneriše token (invalidiranje starog linka).
  - Opcionalno: datum isteka linka (`share_expires_at`).
- Dodatne specifikacije student sam određuje gdje će se nalaziti u sistemu.

---

## Dodatni opis i bodovanje projekta

- Projekat se boduje sa maksimalnih 100%;
- Projekat se brani u 14. i 15. sedmici semestra u terminu vježbi;
- Studenti učitavaju svoje projekte na formu koju assistant pošalje najkasnije 48 sati prije početka prve odbrane (14. sedmice);
- Za svaki dan kašnjenja, student gubi 20% bodova;
- Boduje se kvalitet izrade projekta, kvalitet koda, broj ispoštovanih zahtjeva, stil, te svi ostali koraci navedeni u specifikacijama;
- Bez dodatnih specifikacija student ne može imati maksimalnih 100%;
- Za izradu sistema **obavezno** je koristiti **Node.js + Express** kao backend i **EJS** kao view engine (u skladu sa vježbama). Nije dozvoljeno koristiti React, Vue ili bilo koji drugi SPA framework.
- Bazu podataka je potrebno da studenti sami definišu na osnovu specifikacija.
