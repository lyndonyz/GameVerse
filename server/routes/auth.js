const express = require("express");
const router = express.Router();
const {
  validateLogin,
  addUser,
  addUserWithEmail,
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
      username: user.username
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

module.exports = router;