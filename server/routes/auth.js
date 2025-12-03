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
} = require("../userDB");

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

// -----------------------
// UPDATE USERNAME
// -----------------------
router.post("/update/username", async (req, res) => {
    const { userId, newUsername } = req.body;

    if (!userId || !newUsername) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // 1. Check if the new username is already taken
    if (await userExists(newUsername)) {
         return res.status(400).json({ error: "USERNAME_TAKEN" });
    }

    // 2. Get the current username using the ID
    const currentUsername = await getUsernameById(userId);
    if (!currentUsername) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // 3. Perform the update
    const result = await updateUsername(currentUsername, newUsername);

    if (result && result.error) {
        return res.status(500).json({ error: "UPDATE_FAILED", message: result.error });
    }
    if (!result) {
        return res.status(500).json({ error: "SERVER_ERROR" });
    }

    res.json({ success: true, newUsername });
});

// -----------------------
// UPDATE EMAIL
// -----------------------
router.post("/update/email", async (req, res) => {
    const { userId, newEmail } = req.body;

    if (!userId || !newEmail) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // 1. Get the current username using the ID
    const currentUsername = await getUsernameById(userId);
    if (!currentUsername) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // 2. Perform the update (updateEmail already checks for EMAIL_TAKEN)
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

// -----------------------
// UPDATE PASSWORD
// -----------------------
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

module.exports = router;