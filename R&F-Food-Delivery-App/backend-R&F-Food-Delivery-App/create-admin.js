const { PrismaClient } = require("@prisma/client");
const CryptoJS = require('crypto-js');
require("dotenv").config();

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@rudyetfanny.be";
  const password = "UNMECENOR";
  const name = "Admin";
  const phone = "+32400000000"; // Dummy phone number

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Name:", existingAdmin.name);
      console.log("Type:", existingAdmin.type);

      // Generate new salt and hash for the specified password
      const salt = CryptoJS.lib.WordArray.random(128/8).toString();
      const hashedPassword = CryptoJS.SHA256(password + salt).toString();

      // Update the admin user with new password
      const updatedAdmin = await prisma.user.update({
        where: { email: email },
        data: {
          password: hashedPassword,
          salt: salt,
          name: name,
          phone: phone,
          type: 1, // Ensure it's admin
          enabled: true
        }
      });

      console.log("Admin user password updated successfully!");
      console.log("New password set for:", updatedAdmin.email);
      return;
    }

    // Generate a random salt
    const salt = CryptoJS.lib.WordArray.random(128/8).toString();

    // Hash the password with salt using SHA256 (same as frontend)
    const hashedPassword = CryptoJS.SHA256(password + salt).toString();

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        name: name,
        email: email,
        phone: phone,
        password: hashedPassword,
        salt: salt,
        type: 1, // Admin type
        enabled: true
      }
    });

    console.log("Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Name:", admin.name);
    console.log("Type:", admin.type);

  } catch (error) {
    console.error("Error creating/updating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();