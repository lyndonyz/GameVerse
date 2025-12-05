const express = require("express");
const router = express.Router();
const {
  validateLogin,
  addUser,
  addUserWithEmail,
  updateUsername,
  updateEmail,
  updatePassword,
  getUsernameById,
  userExists
} = require("../db/userDB");
const commentDB = require("../db/commentDB");

// Login handler
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; 
  const user = await validateLogin(identifier, password);
  
  if (!user) {
    return res.status(401).json({ error: "INVALID_LOGIN" });
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email || ""
    }
  });
});

// Account registration handler
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  let result;
  const normalizedEmail = email?.trim();

  if (normalizedEmail) { 
      result = await addUserWithEmail(username, password, normalizedEmail);
  } else {
      result = await addUser(username, password);
  }

  if (result && result.error) {
    if (result.error === "USERNAME_TAKEN") {
        return res.status(400).json({ error: "USERNAME_TAKEN" });
    }
    if (result.error === "EMAIL_TAKEN") {
        return res.status(400).json({ error: "EMAIL_TAKEN" }); 
    }
    return res.status(500).json({ error: "REGISTRATION_FAILED" }); 
  }

  res.json({ success: true, result });
});

// Username update handler
router.post("/update/username", async (req, res) => {
    const { userId, newUsername } = req.body;

    if (!userId || !newUsername) {
        return res.status(400).json({ error: "Missing fields" });
    }

    if (await userExists(newUsername)) {
         return res.status(400).json({ error: "USERNAME_TAKEN" });
    }

    const currentUsername = await getUsernameById(userId);
    if (!currentUsername) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const result = await updateUsername(currentUsername, newUsername);

    if (result && result.error) {
        return res.status(500).json({ error: "UPDATE_FAILED", message: result.error });
    }
    if (!result) {
        return res.status(500).json({ error: "SERVER_ERROR" });
    }

    res.json({ success: true, newUsername });
});

// Email update handler
router.post("/update/email", async (req, res) => {
    const { userId, newEmail } = req.body;

    if (!userId || !newEmail) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const currentUsername = await getUsernameById(userId);
    if (!currentUsername) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const result = await updateEmail(currentUsername, newEmail);

    if (result && result.error) {
        if (result.error === "EMAIL_TAKEN") {
            return res.status(400).json({ error: "EMAIL_TAKEN" });
        }
        return res.status(500).json({ error: "UPDATE_FAILED", message: result.error });
    }
    if (!result) {
        return res.status(500).json({ error: "SERVER_ERROR" });
    }

    res.json({ success: true, newEmail });
});

// Password update handler
router.post("/update/password", async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const currentUsername = await getUsernameById(userId);
    if (!currentUsername) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const user = await validateLogin(currentUsername, currentPassword);
    if (!user) {
        return res.status(401).json({ error: "INVALID_CURRENT_PASSWORD" });
    }

    const result = await updatePassword(currentUsername, newPassword);

    if (result && result.error) {
        return res.status(500).json({ error: "UPDATE_FAILED", message: result.error });
    }
    if (!result) {
        return res.status(500).json({ error: "SERVER_ERROR" });
    }

    res.json({ success: true });
});

// --------------------------
// USER GAME LIST ENDPOINTS
// --------------------------
const {
  addGameToList,
  updateGameStatus,
  gameInList,
  getAllGames,
  removeGameFromList,
} = require("../db/userDB");

// Add a game with default status (plan_to_play)
router.post("/addGameToList", async (req, res) => {
  const { username, gameName, image, slug, status } = req.body;

  if (!username || !gameName) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  // Check if game already exists
  const exists = await gameInList(username, gameName);
  if (exists) {
    return res.json({ error: "GAME_ALREADY_EXISTS" });
  }

  const result = await addGameToList(
  username,
  gameName,
  status ?? 0,
  image,
  slug
);

  if (result && result.error) {
    return res.status(500).json({ error: "ADD_FAILED" });
  }

  res.json({ success: true });
});

// Update game status
router.post("/updateGameStatus", async (req, res) => {
  const { username, gameName, newStatus } = req.body;

  if (!username || !gameName) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  const result = await updateGameStatus(username, gameName, newStatus);

  if (result && result.error) {
    return res.status(500).json({ error: "UPDATE_FAILED" });
  }

  res.json({ success: true });
});

// Remove a game from user's list
router.post("/removeGameFromList", async (req, res) => {
  try {
    const { username, gameName } = req.body;
    if (!username || !gameName) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const result = await removeGameFromList(username, gameName);
    if (!result) {
      return res.status(500).json({ error: "REMOVE_FAILED" });
    }
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("REMOVE GAME ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// Get status of a single game
router.post("/getGameStatus", async (req, res) => {
  const { username, gameName } = req.body;

  const games = await getAllGames(username);
  const entry = games.find((g) => g.gameName === gameName);

  if (!entry) {
    return res.json({ exists: false });
  }

  res.json({ exists: true, status: entry.status });
});

// Get all games in user's list
router.post("/getAllGames", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "MISSING_USERNAME" });
  }

  const list = await getAllGames(username);
  res.json({ success: true, list });
});

// return all comments (existing route)
router.post("/getAllComments", async (req, res) => {
  try {
    const comments = await commentDB.getAllComments();
    if (!comments) return res.status(500).json({ success: false, error: "DB_ERROR" });
    return res.json({ success: true, comments });
  } catch (err) {
    console.error("GET ALL COMMENTS ERROR:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR" });
  }
});

router.post("/deleteComment", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "MISSING_ID" });
    const doc = await commentDB.getCommentById(id);
    if (!doc) return res.status(404).json({ success: false, error: "NOT_FOUND" });
    const rev = doc._rev || doc._metadata?.rev || null;
    const result = await commentDB.deleteComment(id, rev);
    if (!result) return res.status(500).json({ success: false, error: "DELETE_FAILED" });
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    return res.status(500).json({ success: false, error: "SERVER_ERROR" });
  }
});

module.exports = router;