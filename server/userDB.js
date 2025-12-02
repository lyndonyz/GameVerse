const { client, USERS_DB } = require("./db");


// ------------------
// username -> Id
// ------------------
async function getUserId(username) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  return user._id;
}

// ------------------
// id -> Username
// ------------------
async function getUsernameById(id) {
  const user = await getUserById(id); 
  if (!user) return null;
  return user.username; 
}

// ------------------
// Add a user
// ------------------
async function addUser(_username, _password) {
  try {
    const existing = await client.postFind({
      db: USERS_DB,
      selector: { username: _username },
      limit: 1
    });

    if (existing.result.docs.length > 0) {
      return { error: "USERNAME_TAKEN" };
    }

    const newUser = {
      username: _username,
      password: _password
    };

    const res = await client.postDocument({
      db: USERS_DB,
      document: newUser
    });

    return res.result;
  } catch (err) {
    console.error("addUser error:", err);
    return null;
  }
}

// ------------------
// Get a user by id
// ------------------
async function getUserById(id) {
  try {
    const response = await client.getDocument({ db: USERS_DB, docId: id });
    return response.result;
  } catch (err) {
    console.error("getUser error:", err);
  }
}

// ------------------
// Get a user by username
// ------------------
async function getUserByUsername(_username) {
  try {
    const response = await client.postFind({
        db: USERS_DB,
        selector: {
            username: _username,
        },
        limit: 1
    });
    return response.result.docs[0] || null;
  } catch (err) {
    console.error("getUserByUsername error:", err);
    return null;
  }
}


// ------------------
// Check if user exists (true/false)
// ------------------
async function userExists(username) { 
    const u = await getUserByUsername(username); 
    return !!u; 
}

// ------------------
// Validate Login (userinfo/null)
// ------------------
async function validateLogin(username, password) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  if (user.password === password) return user;
  return null;
}




// ------------------
// Remove a document
// ------------------
async function deleteUser(username) {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      console.error(`User "${username}" not found`);
      return null;
    }

    const response = await client.deleteDocument({
      db: USERS_DB,
      docId: user._id,
      rev: user._rev
    });

    console.log(`User "${username}" successfully`);
    return response.result;
  } catch (err) {
    console.error(`Error deleting user "${username}":`, err);
    return null;
  }
}


// ------------------
// List documents
// ------------------
async function listUsers(limit = 99) {
  try {

    const users = await client.postAllDocs({
      db: USERS_DB,
      includeDocs: true,
      limit
    });

    console.log(`Users:`);
    console.log(users.result.rows);
  } catch (err) {
    console.error(`Error accessing database "${USERS_DB}":`, err);
  }
}

// ------------------
// Update Username
// ------------------
async function updateUsername(oldUsername, newUsername) {
  try {
    const user = await getUserByUsername(oldUsername);
    if (!user) {
      console.error(`User "${oldUsername}" not found`);
      return null;
    }

    const updatedDoc = {
      ...user,           // include all existing fields
      username: newUsername 
    };

    const response = await client.putDocument({
      db: USERS_DB,
      docId: user._id,
      document: updatedDoc
    });

    console.log(`Updated username from "${oldUsername}" to "${newUsername}"`);
    return response.result;
  } catch (err) {
    console.error(`Error updating username for "${oldUsername}":`, err);
    return null;
  }
}
// ------------------
// Update Password
// ------------------
async function updatePassword(username, newPassword) {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      console.error(`User "${username}" not found`);
      return null;
    }

    const updatedDoc = {
      ...user,           // include all existing fields
      password: newPassword 
    };

    const response = await client.putDocument({
      db: USERS_DB,
      docId: user._id,
      document: updatedDoc
    });

    console.log(`Updated "${username}"'s password"`);
    return response.result;
  } catch (err) {
    console.error(`Error updating password for "${username}":`, err);
    return null;
  }
}


module.exports = {
  getUserId,
  getUsernameById,
  addUser,
  getUserById,
  getUserByUsername,
  userExists,
  validateLogin,
  deleteUser,
  listUsers,
  updateUsername,
  updatePassword,
};
