const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../../models/user");
const authMiddleware = require("../../middleware/authMiddleware");
const gravatar = require("gravatar");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const router = express.Router();

// Schemat walidacji danych rejestracyjnych
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Schemat walidacji danych logowania
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Konfiguracja Multer do przesyłania avatarów
const tmpDir = path.join(__dirname, "../../tmp");
const avatarsDir = path.join(__dirname, "../../public/avatars");

const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Funkcja do przetwarzania i zapisywania avatarów
const processAvatar = async (req) => {
  const { path: tempPath, originalname } = req.file;
  const extension = path.extname(originalname);
  const newFileName = `${req.user._id}${extension}`;
  const newFilePath = path.join(avatarsDir, newFileName);

  console.log("Using sharp version:", sharp.version);
  console.log("Temp file path:", tempPath);
  console.log("New file path:", newFilePath);

  try {
    await sharp(tempPath).resize(250, 250).toFile(newFilePath);

    // Sprawdź, czy plik tymczasowy istnieje przed próbą usunięcia
    try {
      await fs.access(tempPath);
      await fs.unlink(tempPath);
    } catch (unlinkError) {
      console.warn("Could not delete temp file:", unlinkError.message);
    }

    const avatarURL = `/avatars/${newFileName}`;
    return avatarURL;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
});

// Rejestracja użytkownika
router.post("/signup", async (req, res, next) => {
  const { error } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const avatarURL = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

    const newUser = new User({
      email,
      password: hashedPassword,
      subscription: "starter",
      avatarURL,
      verificationToken,
    });

    await newUser.save();

    // Wysyłanie emaila z linkiem do weryfikacji
    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      auth: {
        user: "postmaster@sandboxd9cfc4d3120744efa26b8ecb535a949b.mailgun.org",
        pass: "d134a5052d78c0532a70374b4aef8627-826eddfb-865e979a",
      },
    });

    const mailOptions = {
      from: "no-reply@contactsapp.com",
      to: email,
      subject: "Verify your email",
      html: `<p>Click <a href="http://localhost:3000/api/users/verify/${verificationToken}">here</a> to verify your email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logowanie użytkownika
router.post("/login", async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.verify) {
      return res.status(401).json({
        message: "Email or password is wrong, or email is not verified",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Wylogowanie użytkownika
router.get("/logout", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = null;
    await user.save();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Pobranie danych aktualnego użytkownika
router.get("/current", authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
      avatarURL: user.avatarURL,
    });
  } catch (error) {
    next(error);
  }
});

// Upload nowego avatara
router.patch(
  "/avatars",
  authMiddleware,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Avatar file is required" });
      }

      const avatarURL = await processAvatar(req);

      req.user.avatarURL = avatarURL;
      await req.user.save();

      res.status(200).json({ avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

// Ponowne wysłanie emaila weryfikacyjnego
router.post("/verify", async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const mailOptions = {
      from: "no-reply@contactsapp.com",
      to: email,
      subject: "Verify your email",
      html: `<p>Click <a href="http://localhost:3000/api/users/verify/${user.verificationToken}">here</a> to verify your email.</p>`,
    };

    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      auth: {
        user: "postmaster@sandboxd9cfc4d3120744efa26b8ecb535a949b.mailgun.org",
        pass: "d134a5052d78c0532a70374b4aef8627-826eddfb-865e979a",
      },
    });

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
