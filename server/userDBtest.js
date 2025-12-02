const {
getUserId,
getUsernameById,
addUser,
getUserById,
getUserByUsername,
userExists,
validateLogin,
deleteUser,
listUsers,
updateUsername,
updatePassword
} = require("./userDB"); // adjust path if needed

// Helper function to wait
function wait(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
console.log("=== USER TEST START ===");

// --- Add User ---
console.log("\n--- Add User ---");
const newUser = await addUser("testuser", "password123");
console.log("Added user:", newUser);
await wait(500);

// --- Check if user exists ---
console.log("\n--- Check if user exists ---");
const exists = await userExists("testuser");
console.log("User exists?", exists);
await wait(500);

// --- Get User ID ---
console.log("\n--- Get User ID ---");
const userId = await getUserId("testuser");
console.log("User ID:", userId);
await wait(500);

// --- Get Username by ID ---
console.log("\n--- Get Username by ID ---");
const username = await getUsernameById(userId);
console.log("Username from ID:", username);
await wait(500);

// --- Get User by Username ---
console.log("\n--- Get User by Username ---");
const userDoc = await getUserByUsername("testuser");
console.log("Fetched user document:", userDoc);
await wait(500);

// --- Validate Login ---
console.log("\n--- Validate Login ---");
const validUser = await validateLogin("testuser", "password123");
console.log("Valid login result:", validUser);
await wait(500);

// --- Update Username ---
console.log("\n--- Update Username ---");
const updatedUsername = await updateUsername("testuser", "testuser2");
console.log("Updated username:", updatedUsername);
await wait(500);

// --- Update Password ---
console.log("\n--- Update Password ---");
const updatedPassword = await updatePassword("testuser2", "newpassword123");
console.log("Updated password:", updatedPassword);
await wait(500);

// --- List Users ---
console.log("\n--- List Users ---");
await listUsers();
await wait(500);

// --- Delete User ---
console.log("\n--- Delete User ---");
const deleteResult = await deleteUser("testuser2"); // uses username
console.log("Deleted user result:", deleteResult);
await wait(500);

console.log("\n=== USER TEST END ===");
})();
