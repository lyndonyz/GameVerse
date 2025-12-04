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

function logSection(name) {
  console.log("\n==============================");
  console.log(name);
  console.log("==============================");
}

(async () => {
  logSection("USER TESTS START");

  // ============
  // USER CREATION
  // ============

  logSection("Add User (Valid)");
  const u1 = await addUser("alpha", "pass123");
  console.log(u1);

  logSection("Add User With Email (Valid)");
  const u2 = await addUserWithEmail("beta", "mypassword", "beta@example.com");
  console.log(u2);

  logSection("Add User (Duplicate Username)");
  const uDup = await addUser("alpha", "anotherpass");
  console.log(uDup); // expect failure / conflict

  logSection("Add User With Email (Duplicate Username)");
  const uDup2 = await addUserWithEmail("beta", "anotherpass", "another@example.com");
  console.log(uDup2); // expect failure

  // ============
  // EXISTENCE & LOOKUP
  // ============

  logSection("User Exists (True)");
  console.log(await userExists("alpha"));

  logSection("User Exists (False)");
  console.log(await userExists("unknownUser123"));

  logSection("Get User ID (Valid)");
  const alphaId = await getUserId("alpha");
  console.log(alphaId);

  logSection("Get Username by ID (Valid)");
  console.log(await getUsernameById(alphaId));

  logSection("Get Username by ID (Invalid ID)");
  console.log(await getUsernameById("madeUpID"));

  logSection("Get User by Username");
  console.log(await getUserByUsername("beta"));

  logSection("Get User by Username (Not Found)");
  console.log(await getUserByUsername("ghost"));

  logSection("Get Email (Valid)");
  console.log(await getEmail("beta"));

  logSection("Get Email (No Email)");
  console.log(await getEmail("alpha"));

  logSection("Get Email (Invalid User)");
  console.log(await getEmail("nosuchuser"));

  // ============
  // LOGIN TESTS
  // ============

  logSection("Validate Login (Correct Password)");
  console.log(await validateLogin("alpha", "pass123"));

  logSection("Validate Login (Wrong Password)");
  console.log(await validateLogin("alpha", "wrongpassword"));

  logSection("Validate Login (User Not Found)");
  console.log(await validateLogin("unknownUser", "password"));

  // ============
  // UPDATE FIELDS
  // ============

  logSection("Update Email (Valid)");
  console.log(await updateEmail("beta", "newbeta@example.com"));

  logSection("Update Email (Invalid User)");
  console.log(await updateEmail("ghostUser", "nothing@example.com"));

  logSection("Update Username (Valid)");
  console.log(await updateUsername("alpha", "alpha2"));

  logSection("Update Username (Username Taken)");
  console.log(await updateUsername("beta", "alpha2")); // alpha2 already used

  logSection("Update Password (Valid)");
  console.log(await updatePassword("alpha2", "newpass999"));

  logSection("Update Password (Invalid User)");
  console.log(await updatePassword("ghostUser", "whatever"));

  // ============
  // GAME LIST TESTS
  // ============

  logSection("Add Games to User List");
  console.log(await addGameToList("alpha2", "Minecraft", 1));
  console.log(await addGameToList("alpha2", "Terraria", 3));
  console.log(await addGameToList("alpha2", "Celeste", 2));

  logSection("Add Game (User Not Found)");
  console.log(await addGameToList("unknownUser", "GameX", 1));

  logSection("Check if Game Exists");
  console.log("Has Minecraft:", await gameInList("alpha2", "Minecraft"));

  logSection("Check if Game Exists (Not Found)");
  console.log(await gameInList("alpha2", "NonexistentGame"));

  logSection("Update Game Status (Valid)");
  console.log(await updateGameStatus("alpha2", "Minecraft", 6));

  logSection("Update Game Status (Game Not Found)");
  console.log(await updateGameStatus("alpha2", "WrongGame", 3));

  logSection("Get All Games");
  console.log(await getAllGames("alpha2"));

  logSection("Get Games By Status (2)");
  console.log(await getGamesByStatus("alpha2", 2));

  logSection("Get Games By Status (Not Found)");
  console.log(await getGamesByStatus("alpha2", 99));

  logSection("Remove Game From List (Valid)");
  console.log(await removeGameFromList("alpha2", "Celeste"));

  logSection("Remove Game (Not Found)");
  console.log(await removeGameFromList("alpha2", "GameDoesNotExist"));

  logSection("All Games After Removal");
  console.log(await getAllGames("alpha2"));

  // ============
  // DELETE USER
  // ============

  logSection("List All Users");
  await listUsers();

  logSection("Delete User (Valid)");
  console.log(await deleteUser("alpha2"));
  console.log(await deleteUser("beta"));

  logSection("Delete User (Invalid)");
  console.log(await deleteUser("ghostUser"));

  logSection("USER TEST END");
})();
