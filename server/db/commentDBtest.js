const {
  addComment,
  getCommentById,
  getCommentsByGameID,
  deleteComment,
  getAvgRatingForGameID,
  getCommentDateById,
  getCommentUsernameById
} = require("./commentDB"); // adjust path if needed

// Helper wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log("=== COMMENTS TEST START ===\n");

  // --- Add Comments ---
  console.log("\n--- Add Comments ---");
  const comment1 = await addComment("game1", "userA", "Great game!", 5);
  console.log("Added comment 1:", comment1);

  const comment2 = await addComment("game1", "userB", "Pretty fun.", 4);
  console.log("Added comment 2:", comment2);

  const comment3 = await addComment("game2", "userA", "Not bad.", 3);
  console.log("Added comment 3:", comment3);

  // wait to ensure timestamps differ
  await wait(500);

  // --- Get Comment by ID ---
  console.log("\n--- Get Comment by ID ---");
  const fetchedComment1 = await getCommentById(comment1.id);
  console.log("Fetched comment 1:", fetchedComment1);

  const fetchedComment2 = await getCommentById(comment2.id);
  console.log("Fetched comment 2:", fetchedComment2);

  // --- Get Comment Username and Date ---
  console.log("\n--- Get Comment Username and Date by ID ---");
  const username1 = await getCommentUsernameById(comment1.id);
  const date1 = await getCommentDateById(comment1.id);
  console.log(`Comment1 by: ${username1}, created at: ${date1}`);

  const username2 = await getCommentUsernameById(comment2.id);
  const date2 = await getCommentDateById(comment2.id);
  console.log(`Comment2 by: ${username2}, created at: ${date2}`);

  // --- Get Comments by Game ID ---
  console.log("\n--- Get Comments by Game ID ---");
  const game1CommentIds = await getCommentsByGameID("game1");
  console.log("Comment IDs for game1:", game1CommentIds);

  // --- Get Average Rating ---
  console.log("\n--- Get Average Rating for Game ---");
  const avgRatingGame1 = await getAvgRatingForGameID("game1");
  console.log("Average rating for game1:", avgRatingGame1);

  const avgRatingGame2 = await getAvgRatingForGameID("game2");
  console.log("Average rating for game2:", avgRatingGame2);

  // --- Delete Comments ---
  console.log("\n--- Delete Comments ---");
  console.log("Deleting comment1:", await deleteComment(comment1.id, comment1.rev));
  console.log("Deleting comment2:", await deleteComment(comment2.id, comment2.rev));
  console.log("Deleting comment3:", await deleteComment(comment3.id, comment3.rev));

  // --- Confirm Deletion ---
  console.log("\n--- Confirm Deletion ---");
  const remainingGame1Comments = await getCommentsByGameID("game1");
  console.log("Remaining comments for game1:", remainingGame1Comments);

  const remainingGame2Comments = await getCommentsByGameID("game2");
  console.log("Remaining comments for game2:", remainingGame2Comments);

  console.log("\n=== COMMENTS TEST END ===");
})();
