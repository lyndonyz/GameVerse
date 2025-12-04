const {
  addComment,
  getCommentById,
  getCommentsByGameID,
  deleteComment,
  getAvgRatingForGameID,
  getCommentDateById,
  getCommentUsernameById
} = require("./commentDB");

// Helper wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log("=== COMMENTS TEST START ===\n");

  //
  // ─────────────────────────────────────────────
  // 1. BASIC ADDING OF COMMENTS
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Add Comments (Normal Cases) ---");
  const c1 = await addComment("game1", "userA", "Great game!", 5);
  const c2 = await addComment("game1", "userB", "Pretty fun", 4);
  const c3 = await addComment("game2", "userC", "Not bad", 3);
  console.log("Added:", c1, c2, c3);

  await wait(300);

  //
  // ─────────────────────────────────────────────
  // 2. FETCH COMMENTS BY ID
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Get Comment by ID (Valid IDs) ---");
  console.log(await getCommentById(c1.id));
  console.log(await getCommentById(c2.id));

  console.log("\n--- Get Comment by ID (Invalid / Non-existing) ---");
  console.log("Invalid ID:", await getCommentById("INVALID_ID"));
  console.log("Missing ID:", await getCommentById(null));

  //
  // ─────────────────────────────────────────────
  // 3. USERNAME + DATE LOOKUP
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Get Username & Date (Valid ID) ---");
  console.log("Username:", await getCommentUsernameById(c1.id));
  console.log("CreatedAt:", await getCommentDateById(c1.id));

  console.log("\n--- Get Username & Date (Invalid ID) ---");
  console.log("Username invalid:", await getCommentUsernameById("FAKE"));
  console.log("Date invalid:", await getCommentDateById("FAKE"));

  //
  // ─────────────────────────────────────────────
  // 4. GET COMMENTS BY GAME ID
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Get Comments by Game ID ---");
  console.log("game1 IDs:", await getCommentsByGameID("game1"));
  console.log("game2 IDs:", await getCommentsByGameID("game2"));
  
  console.log("non-existing game:", await getCommentsByGameID("does_not_exist"));
  console.log("null game ID:", await getCommentsByGameID(null));

  //
  // ─────────────────────────────────────────────
  // 5. GET AVERAGE RATING
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Average Rating Tests ---");
  console.log("game1 avg:", await getAvgRatingForGameID("game1"));
  console.log("game2 avg:", await getAvgRatingForGameID("game2"));
  console.log("no ratings:", await getAvgRatingForGameID("no_comments_game"));
  console.log("invalid game ID:", await getAvgRatingForGameID(null));

  //
  // ─────────────────────────────────────────────
  // 6. EDGE CASES: ADD COMMENT WITH BAD DATA
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Add Comment (Edge Cases) ---");
  console.log("Missing username:", await addComment("gameX", null, "Test", 4));
  console.log("Missing rating:", await addComment("gameX", "userZ", "Missing rating", null));
  console.log("Missing comment:", await addComment("gameX", "userZ", null, 5));

  //
  // ─────────────────────────────────────────────
  // 7. DELETE TESTING
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Delete Comments (Valid) ---");
  console.log(await deleteComment(c1.id, c1.rev));
  console.log(await deleteComment(c2.id, c2.rev));
  console.log(await deleteComment(c3.id, c3.rev));

  console.log("\n--- Delete Comments (Invalid) ---");
  console.log(await deleteComment("BADID", "BADREV"));
  console.log(await deleteComment(null, null));

  //
  // ─────────────────────────────────────────────
  // 8. CONFIRM DELETIONS
  // ─────────────────────────────────────────────
  //
  console.log("\n--- Confirm Deletion ---");
  console.log("game1 remaining:", await getCommentsByGameID("game1"));
  console.log("game2 remaining:", await getCommentsByGameID("game2"));
  
  console.log("\n--- Fetch Deleted Comments ---");
  console.log("c1 fetch:", await getCommentById(c1.id));
  console.log("c2 fetch:", await getCommentById(c2.id));

  console.log("\n=== COMMENTS TEST END ===");
})();
