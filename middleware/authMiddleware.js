const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Sprawdź, czy nagłówek autoryzacji istnieje i czy zawiera token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = authHeader.split(" ")[1]; // Pobierz token z nagłówka

  try {
    // Weryfikacja tokenu
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Szukamy użytkownika po ID zdekodowanego z tokenu
    const user = await User.findById(decoded.id);

    // Jeśli użytkownik nie istnieje lub tokeny się nie pokrywają, zwróć błąd
    if (!user || user.token !== token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Jeśli wszystko jest w porządku, zapisz użytkownika w req.user
    req.user = user;

    // Wywołaj następny middleware
    next();
  } catch (error) {
    // Jeśli wystąpił błąd podczas weryfikacji tokenu
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = authMiddleware;
