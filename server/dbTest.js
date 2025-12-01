const { addDoc, getDocById, updateDoc, deleteDoc, findDocByField, listDbDocuments } = require("./db");

const usersDB = "gameverse-users-db";

(async () => {
  try {
    console.log("\n--- LIST DOCUMENTS ---");
    await listDbDocuments(usersDB, 5);

    console.log("\n--- ADD DOCUMENT ---");
    const newUser = {
      username: "testuser1",
      password: "password123"
    };
    // For gameverse-comments-db its (_id, game_id, rating, comment)
    const added = await addDoc(usersDB, newUser);
    console.log("Added document:", added);

    const docId = added.id;

    console.log("\n--- GET DOCUMENT BY ID ---");
    const fetched = await getDocById(usersDB, docId);
    console.log("Fetched document:", fetched);

    console.log("\n--- GET DOCUMENT BY NAME ---");
    const fetched2 = await findDocByField(usersDB, "username", "Josh");
    console.log("Fetched document:", fetched2);

    console.log("\n--- UPDATE DOCUMENT ---");
    fetched.role = "admin"; // change role
    const updated = await updateDoc(usersDB, fetched);
    console.log("Updated document:", updated);

    console.log("\n--- LIST DOCUMENTS AGAIN ---");
    await listDbDocuments(usersDB, 5);

    console.log("\n--- REMOVE DOCUMENT ---");
    const removed = await deleteDoc(usersDB, docId, updated.rev);
    console.log("Removed document:", removed);

    console.log("\n--- LIST DOCUMENTS AGAIN ---");
    await listDbDocuments(usersDB, 5);

  } catch (err) {
    console.error("Test error:", err);
  }
})();
