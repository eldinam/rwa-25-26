// ==========================================================
// -V10 NOVI FAJL — requireLogin middleware
// ==========================================================
// Middleware = funkcija koja se izvrsi PRIJE rute.
//
// Express svakoj middleware funkciji daje 3 argumenta:
//   - req  -> zahtjev
//   - res  -> odgovor
//   - next -> funkcija "pusti dalje"
//
// Ako pozovemo `next()`, Express ide na sljedecu middleware /
// rutu. Ako umjesto toga pozovemo `res.redirect(...)` ili
// `res.send(...)`, ruta SE NE IZVRSAVA — zaustavili smo zahtjev.
//
// requireLogin radi tacno to: ako korisnik NIJE prijavljen,
// preusmjerava ga na /login. Ako jeste, pusta dalje.

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    // Korisnik nije prijavljen -> nazad na login
    return res.redirect("/login");
  }
  // Prijavljen je -> pusti dalje na trazenu rutu
  next();
}

module.exports = requireLogin;
