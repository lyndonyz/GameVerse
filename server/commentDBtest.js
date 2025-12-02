const {
addComment,
getCommentById,
getCommentsByGameID,
deleteComment,
getAvgRatingForGameID
} = require("./commentDB"); // adjust path if needed

// Helper delay function to avoid rate limits
function wait(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
console.log("=== COMMENTS TEST START ===");

const GAME_ID = "game123";

// --- Add Comments ---
console.log("\n--- Adding Comments ---");
const comment1 = await addComment(GAME_ID, "user1", "Great game!", 5);
console.log("Added comment 1:", comment1);
await wait(300);

const comment2 = await addComment(GAME_ID, "user2", "Not bad.", 4);
console.log("Added comment 2:", comment2);
await wait(300);

const comment3 = await addComment(GAME_ID, "user3", "Could be better.", 3);
console.log("Added comment 3:", comment3);
await wait(300);

// --- Get Comments by Game ID ---
console.log("\n--- Get Comment IDs by Game ID ---");
const commentIds = await getCommentsByGameID(GAME_ID);
console.log("Comment IDs for game:", commentIds);
await wait(300);

// --- Get Individual Comment ---
console.log("\n--- Fetch Individual Comment ---");
if (commentIds.length > 0) {
const commentDoc = await getCommentById(commentIds[0]);
console.log("First comment details:", commentDoc);
await wait(300);
}

// --- Get Average Rating ---
console.log("\n--- Get Average Rating ---");
const avgRating = await getAvgRatingForGameID(GAME_ID);
console.log("Average rating for game:", avgRating);
await wait(300);

// --- Cleanup: Delete Comments ---
console.log("\n--- Deleting Comments ---");
for (const id of commentIds) {
const commentDoc = await getCommentById(id);
const delResult = await deleteComment(commentDoc._id, commentDoc._rev);
console.log(`Deleted comment ${id}:`, delResult);
await wait(300);
}

console.log("\n=== COMMENTS TEST END ===");
})();
