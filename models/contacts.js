const mongoose = require("mongoose");
const Joi = require("joi");

// Walidacja Joi dla kontaktu
const contactSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required(),
  favorite: Joi.boolean(), // Dodano pole `favorite` do walidacji
});

// Definiowanie schematu Mongoose dla kontaktu
const mongooseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    match: /^\(\d{3}\) \d{3}-\d{4}$/,
  },
  favorite: {
    type: Boolean,
    default: false, // Domyślna wartość `favorite` to false
  },
});

// Tworzenie modelu Contact
const Contact = mongoose.model("Contact", mongooseSchema);

// Funkcje do zarządzania kontaktami
const listContacts = async () => {
  try {
    const contacts = await Contact.find();
    return contacts;
  } catch (error) {
    console.error("Błąd podczas odczytu kontaktów:", error);
    throw error;
  }
};

const getContactById = async (contactId) => {
  try {
    const contact = await Contact.findById(contactId);
    return contact || null;
  } catch (error) {
    console.error("Błąd podczas wyszukiwania kontaktu:", error);
    throw error;
  }
};

const removeContact = async (contactId) => {
  try {
    const result = await Contact.findByIdAndDelete(contactId);
    return result ? { message: "contact deleted" } : null;
  } catch (error) {
    console.error("Błąd podczas usuwania kontaktu:", error);
    throw error;
  }
};

const addContact = async (body) => {
  try {
    const newContact = new Contact(body);
    await newContact.save();
    return newContact;
  } catch (error) {
    console.error("Błąd podczas dodawania kontaktu:", error);
    throw error;
  }
};

const updateContact = async (contactId, body) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(contactId, body, {
      new: true,
    });
    return updatedContact || null;
  } catch (error) {
    console.error("Błąd podczas aktualizacji kontaktu:", error);
    throw error;
  }
};

const updateStatusContact = async (contactId, { favorite }) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );
    return updatedContact || null;
  } catch (error) {
    console.error("Błąd podczas aktualizacji statusu kontaktu:", error);
    throw error;
  }
};

const listFavoriteContacts = async () => {
  try {
    const favoriteContacts = await Contact.find({ favorite: true });
    return favoriteContacts;
  } catch (error) {
    console.error("Błąd podczas odczytu ulubionych kontaktów:", error);
    throw error;
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
  listFavoriteContacts,
  contactSchema,
};
