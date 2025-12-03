const {
  getUserId,
  getUsernameById,
  addUser,
  addUserWithEmail,
  getUserById,
  getUserByUsername,
  getEmail,
  userExists,
  validateLogin,
  deleteUser,
  listUsers,
  updateUsername,
  updateEmail,
  updatePassword,
} = require("./userDB");

// Helper function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log("=== USER TEST START ===");

<<<<<<< HEAD
    // --- Add User (no email) ---
    console.log("\n--- Add User (no email) ---");
    const user1 = await addUser("Josh", "password123");
    console.log("Added:", user1);

    // --- Add User with Email ---
    console.log("\n--- Add User with Email ---");
    const user2 = await addUserWithEmail("testuser", "password123", "test@example.com");
    console.log("Added:", user2);

    // --- Check if user exists ---
    console.log("\n--- Check if user exists ---");
    const exists = await userExists("testuser");
    console.log("User exists?", exists);

    // --- Get User ID ---
    console.log("\n--- Get User ID ---");
    const userId = await getUserId("testuser");
    console.log("User ID:", userId);

    // --- Get Username by ID ---
    console.log("\n--- Get Username by ID ---");
    const username = await getUsernameById(userId);
    console.log("Username from ID:", username);

    // --- Get User by Username ---
    console.log("\n--- Get User by Username ---");
    const userDoc = await getUserByUsername("testuser");
    console.log("Fetched user document:", userDoc);

    // --- Get Email ---
    console.log("\n--- Get Email ---");
    const email = await getEmail("testuser");
    console.log("Email:", email);

    // --- Validate Login ---
    console.log("\n--- Validate Login ---");
    const validUser = await validateLogin("testuser", "password123");
    console.log("Valid login result:", validUser);

    // --- Update Email ---
    console.log("\n--- Update Email ---");
    const updatedEmail = await updateEmail("testuser", "newemail@example.com");
    console.log("Updated email:", updatedEmail);

    // --- Confirm Email Updated ---
    console.log("\n--- Confirm Updated Email ---");
    const newEmailCheck = await getEmail("testuser");
    console.log("Email now:", newEmailCheck);

    // --- Update Username ---
    console.log("\n--- Update Username ---");
    const updatedUsername = await updateUsername("testuser", "testuser2");
    console.log("Updated username:", updatedUsername);

    // --- Update Password ---
    console.log("\n--- Update Password ---");
    const updatedPassword = await updatePassword("testuser2", "newpassword123");
    console.log("Updated password:", updatedPassword);

    // --- List Users ---
    console.log("\n--- List Users ---");
    await listUsers();

    // --- Delete User ---
    console.log("\n--- Delete User ---");
    const deleteResult = await deleteUser("testuser2");
    console.log("Deleted user result:", deleteResult);

    console.log("\n=== USER TEST END ===");
=======
// --- Add User ---
console.log("\n--- Add User ---");
const newUser = await addUser("admin", "111111");
console.log("Added user:", newUser);
await wait(500);

// // --- Check if user exists ---
// console.log("\n--- Check if user exists ---");
// const exists = await userExists("testuser");
// console.log("User exists?", exists);
// await wait(500);

// // --- Get User ID ---
// console.log("\n--- Get User ID ---");
// const userId = await getUserId("testuser");
// console.log("User ID:", userId);
// await wait(500);

// // --- Get Username by ID ---
// console.log("\n--- Get Username by ID ---");
// const username = await getUsernameById(userId);
// console.log("Username from ID:", username);
// await wait(500);

// // --- Get User by Username ---
// console.log("\n--- Get User by Username ---");
// const userDoc = await getUserByUsername("testuser");
// console.log("Fetched user document:", userDoc);
// await wait(500);

// // --- Validate Login ---
// console.log("\n--- Validate Login ---");
// const validUser = await validateLogin("testuser", "password123");
// console.log("Valid login result:", validUser);
// await wait(500);

// // --- Update Username ---
// console.log("\n--- Update Username ---");
// const updatedUsername = await updateUsername("testuser", "testuser2");
// console.log("Updated username:", updatedUsername);
// await wait(500);

// // --- Update Password ---
// console.log("\n--- Update Password ---");
// const updatedPassword = await updatePassword("testuser2", "newpassword123");
// console.log("Updated password:", updatedPassword);
// await wait(500);

// // --- List Users ---
// console.log("\n--- List Users ---");
// await listUsers();
// await wait(500);

// // --- Delete User ---
// console.log("\n--- Delete User ---");
// const deleteResult = await deleteUser("testuser2"); // uses username
// console.log("Deleted user result:", deleteResult);
// await wait(500);

// console.log("\n=== USER TEST END ===");
>>>>>>> 77c646b7dd5c86930dc217137c8e948e0c4525a8
})();
