const { client, COMMENTS_DB } = require("./db");
const { RetrySystem } = require("./retrySystem");


// ------------------
// Setup RetrySystem
// ------------------
const retrySystemInstance = new RetrySystem({
    retry: {
        maxRetries: 5,
        minimumDelay: 200,
        maxDelay: 3000
    },
});

// ------------------
// Add a Comment
// ------------------
async function addComment(_game_id, _username, _comment, _rating) {
  try {

    const newComment = {
      username: _username,
      comment: _comment,
      gameid: _game_id,
      rating: _rating
    };
    
    const response = await retrySystemInstance.execute(() =>
            client.postDocument({
                db: COMMENTS_DB,
                document: newComment
            })
        );

    return response.result; 
  } catch (err) {
    console.error("Error adding comment:", err);
    return null;
  }
}

// ------------------
// Get comment by ID
// ------------------
async function getCommentById(id) {
  try {
        const response = await retrySystemInstance.execute(() =>
            client.getDocument({
                db: COMMENTS_DB,
                docId: id
            })
        );

        return response.result;
  } catch (err) {
    console.error("getCommentById error:", err);
    return null;
  }
}
// ------------------
// Delete comment
// ------------------
async function deleteComment(id, rev) {
  try {
    const response = await retrySystemInstance.execute(() =>
            client.deleteDocument({
                db: COMMENTS_DB,
                docId: id,
                rev
            })
        );
        return response.result;
  } catch (err) {
    console.error("deleteComment error:", err);
    return null;
  }
}

// ------------------
// Gets comments by gameID
// ------------------
async function getCommentsByGameID(game_id) {
    try {
    const response = await retrySystemInstance.execute(() =>
            client.postFind({
                db: COMMENTS_DB,
                selector: { gameid: game_id },
                fields: ["_id"]
            })
        );
    const commentIds = response.result.docs.map(doc => doc._id);
    return commentIds; // list of ids
    } catch (err) {
        console.error("getCommentsByGameID error:", err);
        return null;
    }
}

// ------------------
// Average rating for any given game
// ------------------
async function getAvgRatingForGameID(game_id) {
    try {
    const response = await retrySystemInstance.execute(() =>
            client.postFind({
                db: COMMENTS_DB,
                selector: { gameid: game_id },
                fields: ["rating"]
            })
        );

    const ratings = response.result.docs.map(doc => doc.rating);
     if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, val) => acc + val, 0);
    const avg = sum / ratings.length;

    return avg;
    } catch (err) {
        console.error("getCommentsByGameID error:", err);
        return null;
    }

}
module.exports = {
  addComment,
  getCommentById,
  getCommentsByGameID,
  deleteComment,
  getAvgRatingForGameID
};
