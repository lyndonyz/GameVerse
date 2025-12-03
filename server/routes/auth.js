const express = require("express");
const router = express.Router();
const {
  validateLogin,
  addUser,
  userExists
} = require("../userDB");

// -----------------------
// LOGIN
// -----------------------
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await validateLogin(username, password);
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

// -----------------------
// REGISTER
// -----------------------
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const exists = await userExists(username);
  if (exists) {
    return res.status(400).json({ error: "USERNAME_TAKEN" });
  }

  const result = await addUser(username, password);
  res.json({ success: true, result });
});

module.exports = router;
