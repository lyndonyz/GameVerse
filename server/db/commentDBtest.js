const {
  addComment,
  getCommentById,
  getCommentsByGameID,
  deleteComment,
  getAvgRatingForGameID,
  getCommentDateById,
  getCommentUsernameById
} = require("./commentDB");

function logSection(name) {
  console.log("\n==============================");
  console.log(name);
  console.log("==============================");
}


(async () => {
  logSection("COMMENTS TEST START");


  // ============
  // BASIC ADDING OF COMMENTS
  // ============

  logSection("Add Comments (Normal Cases)");
  const c1 = await addComment("game1", "userA", "Great game!", 5);
  const c2 = await addComment("game1", "userB", "Pretty fun", 4);
  const c3 = await addComment("game2", "userC", "Not bad", 3);
  console.log("Added:", c1, c2, c3);


  // ============
  // FETCH COMMENTS BY ID
  // ============

  logSection("Get Comment by ID (Valid IDs)");
  console.log(await getCommentById(c1.id));
  console.log(await getCommentById(c2.id));

  logSection("Get Comment by ID (Invalid / Non-existing)");
  console.log("Invalid ID:", await getCommentById("INVALID_ID"));
  console.log("Missing ID:", await getCommentById(null));


  // ============
  // USERNAME + DATE LOOKUP
  // ============

  logSection("Get Username & Date (Valid ID)");
  console.log("Username:", await getCommentUsernameById(c1.id));
  console.log("CreatedAt:", await getCommentDateById(c1.id));

  logSection("Get Username & Date (Invalid ID)");
  console.log("Username invalid:", await getCommentUsernameById("FAKE"));
  console.log("Date invalid:", await getCommentDateById("FAKE"));


  // ============
  // GET COMMENTS BY GAME ID
  // ============

  logSection("Get Comments by Game ID");
  console.log("game1 IDs:", await getCommentsByGameID("game1"));
  console.log("game2 IDs:", await getCommentsByGameID("game2"));
  
  console.log("non-existing game:", await getCommentsByGameID("does_not_exist"));
  console.log("null game ID:", await getCommentsByGameID(null));


  // ============
  // GET AVERAGE RATING
  // ============

  logSection("Average Rating Tests");
  console.log("game1 avg:", await getAvgRatingForGameID("game1"));
  console.log("game2 avg:", await getAvgRatingForGameID("game2"));
  console.log("no ratings:", await getAvgRatingForGameID("no_comments_game"));
  console.log("invalid game ID:", await getAvgRatingForGameID(null));


  // ============
  // EDGE CASES: ADD COMMENT WITH BAD DATA
  // ============

  logSection("Add Comment (Edge Cases)");
  console.log("Missing username:", await addComment("gameX", null, "Test", 4));
  console.log("Missing rating:", await addComment("gameX", "userZ", "Missing rating", null));
  console.log("Missing comment:", await addComment("gameX", "userZ", null, 5));


  // ============
  // DELETE TESTING
  // ============

  logSection("Delete Comments (Valid)");
  console.log(await deleteComment(c1.id, c1.rev));
  console.log(await deleteComment(c2.id, c2.rev));
  console.log(await deleteComment(c3.id, c3.rev));

  logSection("Delete Comments (Invalid)");
  console.log(await deleteComment("BADID", "BADREV"));
  console.log(await deleteComment(null, null));


  // ============
  // CONFIRM DELETIONS
  // ============

  logSection("Confirm Deletion");
  console.log("game1 remaining:", await getCommentsByGameID("game1"));
  console.log("game2 remaining:", await getCommentsByGameID("game2"));
  
  logSection("Fetch Deleted Comments");
  console.log("c1 fetch:", await getCommentById(c1.id));
  console.log("c2 fetch:", await getCommentById(c2.id));

  logSection("COMMENTS TEST END");
})();
