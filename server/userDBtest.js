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
  addGameToList,
  updateGameStatus,
  removeGameFromList,
  gameInList,
  getAllGames,
  getGamesByStatus
} = require("./userDB");

// Helper wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log("=== USER TEST START ===\n");

  // --- Add User (no email) ---
  console.log("\n--- Add User (no email) ---");
  const user1 = await addUser("testuser", "password123");
  console.log("Added:", user1);

  // --- Add User with Email ---
  console.log("\n--- Add User with Email ---");
  const user2 = await addUserWithEmail("testuser", "password123", "test@example.com");
  console.log("Added:", user2);

  // --- Check if user exists ---
  console.log("\n--- Check if user exists ---");
  console.log("User exists?", await userExists("testuser"));

  // --- Get User ID ---
  console.log("\n--- Get User ID ---");
  const userId = await getUserId("testuser");
  console.log("User ID:", userId);

  // --- Get Username by ID ---
  console.log("\n--- Get Username by ID ---");
  console.log("Username from ID:", await getUsernameById(userId));

  // --- Get User by Username ---
  console.log("\n--- Get User by Username ---");
  console.log("Fetched user document:", await getUserByUsername("testuser"));

  // --- Get Email ---
  console.log("\n--- Get Email ---");
  console.log("Email:", await getEmail("testuser"));

  // --- Validate Login ---
  console.log("\n--- Validate Login ---");
  console.log("Valid login result:", await validateLogin("testuser", "password123"));

  // --- Update Email ---
  console.log("\n--- Update Email ---");
  console.log("Updated email:", await updateEmail("testuser", "newemail@example.com"));

  // --- Confirm Email Updated ---
  console.log("\n--- Confirm Updated Email ---");
  console.log("Email now:", await getEmail("testuser"));

  // --- Update Username ---
  console.log("\n--- Update Username ---");
  await updateUsername("testuser", "testuser2");
  console.log("Username updated.");

  // --- Update Password ---
  console.log("\n--- Update Password ---");
  console.log("Updated password:", await updatePassword("testuser2", "newpassword123"));

  // =============================
  // GAME / LIST TESTS
  // =============================

  console.log("\n========================");
  console.log("GAME LIST TESTS START");
  console.log("========================");

  // --- Add games ---
  console.log("\n--- Add Games to List ---");
  console.log(await addGameToList("testuser2", "Minecraft", 1));
  console.log(await addGameToList("testuser2", "Terraria", 3));
  console.log(await addGameToList("testuser2", "OneShot", 2));
  console.log(await addGameToList("asd", "Undertale", 2));
  console.log(await addGameToList("testuser2", "Ultrakill", 2));

  // --- Check if game exists ---
  console.log("\n--- Check if game exists ---");
  console.log("Has Minecraft?", await gameInList("testuser2", "Minecraft"));

  // --- Update game status ---
  console.log("\n--- Update Game Status ---");
  console.log(await updateGameStatus("testuser2", "Minecraft", 6)); // set to Completed

  // --- Get all games ---
  console.log("\n--- Get All Games ---");
  console.log(await getAllGames("testuser2"));

  // --- Get games by specific status ---
  console.log("\n--- Get Games by Status (2 = Completed) ---");
  console.log(await getGamesByStatus("testuser2", 2));

  // --- Remove a game ---
  console.log("\n--- Remove Game From List ---");
  console.log(await removeGameFromList("testuser2", "s"));

  // --- Confirm List After Remove ---
  console.log("\n--- All Games After Removal ---");
  console.log(await getAllGames("testuser2"));

  // =============================

  // --- List all users ---
  console.log("\n--- List Users ---");
  await listUsers();

  // --- Delete User ---
  console.log("\n--- Delete User ---");
  console.log(await deleteUser("testuser2"));

  console.log("\n=== USER TEST END ===");
})();