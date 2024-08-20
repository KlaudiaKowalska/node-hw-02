// const fs = require('fs/promises')
const fs = require("fs").promises;
const path = require("path");
const Joi = require("joi");

const contactSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required(),
});

const contactsPath = path.join(__dirname, "contacts.json");

const listContacts = async () => {
  try {
    const data = await fs.readFile(contactsPath, "utf8");
    const contacts = JSON.parse(data);
    return contacts;
  } catch (error) {
    console.error("Błąd podczas odczytu kontaktów:", error);
    throw error;
  }
};

const getContactById = async (contactId) => {
  try {
    const contacts = await listContacts();
    console.log("Szukane ID:", contactId);
    const contact = contacts.find((contact) => contact.id === contactId);
    return contact || null;
  } catch (error) {
    console.error("Błąd podczas wyszukiwania kontaktu:", error);
    throw error; // Rzucenie błędu dalej, aby mógł być obsłużony przez middleware
  }
};

const removeContact = async (contactId) => {
  try {
    const contacts = await listContacts();
    const index = contacts.findIndex((contact) => contact.id === contactId);

    if (index === -1) {
      return null; // Kontakt nie znaleziony
    }

    contacts.splice(index, 1); // Usuwanie kontaktu
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2)); // Zapisanie zaktualizowanego pliku
    return { message: "contact deleted" };
  } catch (error) {
    console.error("Błąd podczas usuwania kontaktu:", error);
    throw error;
  }
};

const addContact = async (body) => {
  try {
    const { nanoid } = await import("nanoid"); // Import nanoid wewnątrz funkcji
    const contacts = await listContacts();
    const newContact = { id: nanoid(), ...body }; // Dodanie unikalnego ID i rozpakowanie pól body
    contacts.push(newContact);
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2)); // Zapisanie zaktualizowanego pliku
    return newContact;
  } catch (error) {
    console.error("Błąd podczas dodawania kontaktu:", error);
    throw error;
  }
};

const updateContact = async (contactId, body) => {
  try {
    const contacts = await listContacts();
    const index = contacts.findIndex((contact) => contact.id === contactId);

    if (index === -1) {
      return null; // Kontakt nie znaleziony
    }

    contacts[index] = { ...contacts[index], ...body };
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return contacts[index];
  } catch (error) {
    console.error("Błąd podczas aktualizacji kontaktu:", error);
    throw error;
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  contactSchema,
};
