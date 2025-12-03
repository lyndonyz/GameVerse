const {
  addComment,
  getCommentById,
  getCommentsByGameID,
  deleteComment,
  getAvgRatingForGameID
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

  // --- Get Comment by ID ---
  console.log("\n--- Get Comment by ID ---");
  const fetchedComment = await getCommentById(comment1.id);
  console.log("Fetched comment 1:", fetchedComment);

  // --- Get Comments by Game ID ---
  console.log("\n--- Get Comments by Game ID (game1) ---");
  const game1Comments = await getCommentsByGameID("game1");
  console.log("Comment IDs for game1:", game1Comments);

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
  const remainingCommentsGame1 = await getCommentsByGameID("game1");
  console.log("Remaining comments for game1:", remainingCommentsGame1);

  console.log("\n=== COMMENTS TEST END ===");
})();
