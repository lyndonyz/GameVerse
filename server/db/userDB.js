const { client, USERS_DB } = require("./db");
const { RetrySystem } = require("./retrySystem");

// ------------------
// Setup RetrySystem
// ------------------
const retrySystemInstance = new RetrySystem({
    retry: {
        maxRetries: 5,      
        minimumDelay: 300,  
        maxDelay: 3000  
    },
});
// ------------------
// username -> Id
// ------------------
async function getUserId(username) { 
    const user = await getUserByUsername(username)
    return user?._id || null;
}


// ------------------
// id -> Username
// ------------------
async function getUsernameById(id) {
    const user = await getUserById(id);
    return user?.username || null;
}



// ------------------
// Add a user
// ------------------
async function addUser(_username, _password) {
    try {
        const existing = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { username: { $regex: `(?i)^${_username}$` } },
                limit: 1
            })
        );

        if (existing.result.docs.length > 0) {
            return { error: "USERNAME_TAKEN" };
        }

        const newUser = { username: _username, password: _password };

        const res = await retrySystemInstance.execute(() =>
            client.postDocument({
                db: USERS_DB,
                document: newUser
            })
        );

        return res.result;

    } catch (err) {
        console.error("addUser error:", err);
        return null;
    }
}


// ------------------
// Add a user with email
// ------------------
async function addUserWithEmail(_username, _password, _email) {
    try {
        const existingName = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { username: { $regex: `(?i)^${_username}$` } },
                limit: 1
            })
        );

        if (existingName.result.docs.length > 0) {
            return { error: "USERNAME_TAKEN" };
        }

         const existingEmail = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { email: { $regex: `(?i)^${_email}$` } },
                limit: 1
            })
        );

        if (existingEmail.result.docs.length > 0) {
            return { error: "EMAIL_TAKEN" };
        }


        const newUser = { username: _username, password: _password , email: _email};

        const res = await retrySystemInstance.execute(() =>
            client.postDocument({
                db: USERS_DB,
                document: newUser
            })
        );

        return res.result;

    } catch (err) {
        console.error("addUserWithEmail error:", err);
        return null;
    }
}

// ------------------
// Get a user by id
// ------------------
async function getUserById(id) {
    const response = await retrySystemInstance.execute(() =>
        client.postFind({
            db: USERS_DB,
            selector: { _id: id },
            limit: 1
        })
    );

    return response.result.docs[0] || null;
}

// ------------------
// Get Email
// ------------------
async function getEmail(username) {
    const user = await getUserByUsername(username);
    return user?.email || null;
}



// ------------------
// Get a user by username
// ------------------
async function getUserByUsername(_username) {
    try {
        const response = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { username: { $regex: `(?i)^${_username}$` } },
                limit: 1
            })
        );
        return response.result.docs[0] || null;
    } catch (err) {
        throw err;
    }
}

// ------------------
// Check if user exists (true/false)
// ------------------
async function userExists(username) {
    try {
        const u = await getUserByUsername(username);
        return !!u;
    } catch (err) {
        console.log(err.message);
        return false;
    }
}

// ------------------
// Validate Login (userinfo/null)
// ------------------
async function validateLogin(identifier, password) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier); 
    let user = null;
    if (isEmail) {
        const response = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { email: identifier },
                limit: 1
            })
        );
        user = response.result.docs[0] || null;
    } 
    else {
        user = await getUserByUsername(identifier);
    }
    if (!user) return null;
    return user.password === password ? user : null; 
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

        
        const response = await retrySystemInstance.execute(() =>
            client.deleteDocument({
                db: USERS_DB,
                docId: user._id,
                rev: user._rev
            })
        );

        console.log(`User "${username}" deleted successfully`);
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
        const users = await retrySystemInstance.execute(() =>
            client.postAllDocs({
                db: USERS_DB,
                includeDocs: true,
                limit
            })
        );
        console.log(`Users:`);
        console.log(users.result.rows);
    } catch (err) {
        console.error(`Error accessing database "${USERS_DB}":`, err);
    }
}

// ------------------
// Update Email
// ------------------
async function updateEmail(username, newEmail) {
    try {
        const user = await getUserByUsername(username);
        if (!user) {
            console.error(`User "${username}" not found`);
            return null;
        }

        const currentEmail = user.email || null;

        if (currentEmail === newEmail) {
            console.log(`Email for "${username}" already set to "${newEmail}"`);
            return user;
        }

        const emailLookup = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { email: { $regex: `(?i)^${newEmail}$` } },
                limit: 1
            })
        );

        if (emailLookup.result.docs.length > 0) {
            console.error(`Email "${newEmail}" is already taken`);
            return { error: "EMAIL_TAKEN" };
        }

        const updatedDoc = { ...user, email: newEmail };

        const response = await retrySystemInstance.execute(() =>
            client.putDocument({
                db: USERS_DB,
                docId: user._id,
                document: updatedDoc
            })
        );

        console.log(`Updated email for "${username}" to "${newEmail}"`);
        return response.result;

    } catch (err) {
        console.error(`Error updating email for "${username}":`, err);
        return null;
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
        const existing = await retrySystemInstance.execute(() =>
            client.postFind({
                db: USERS_DB,
                selector: { username: { $regex: `(?i)^${newUsername}$` } },
                limit: 1
            })
        );

        if (existing.result.docs.length > 0) {
            return { error: "NEW_USERNAME_TAKEN" };
        }

        const updatedDoc = { ...user, username: newUsername };

        const response = await retrySystemInstance.execute(() =>
            client.putDocument({
                db: USERS_DB,
                docId: user._id,
                document: updatedDoc
            })
        );

        console.log(`Updated username from "${oldUsername}" to "${newUsername}"`);
        return response.result;
    } catch (err) {
        console.error(`Error updating username for "${oldUsername}":`, err);
        return null;
    }
}

// ------------------
// Add list
// ------------------
async function addToList(_gameToAdd, _listNum) {
    try {
        const user = await getUserByUsername(oldUsername);
        if (!user) {
            console.error(`User "${oldUsername}" not found`);
            return null;
        }

        const updatedDoc = { ...user, username: newUsername };

        const response = await retrySystemInstance.execute(() =>
            client.putDocument({
                db: USERS_DB,
                docId: user._id,
                document: updatedDoc
            })
        );

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

        const updatedDoc = { ...user, password: newPassword };

         const response = await retrySystemInstance.execute(() =>
            client.putDocument({
                db: USERS_DB,
                docId: user._id,
                document: updatedDoc
            })
        );

        console.log(`Updated password for "${username}"`);
        return response.result;
    } catch (err) {
        console.error(`Error updating password for "${username}":`, err);
        return null;
    }
}


// ------------------
// Remove a game
// ------------------
async function removeGameFromList(username, gameName) {
    const user = await getUserByUsername(username);
    if (!user) {
            console.error(`User "${username}" not found`);
            return null;
        }

    user.list = user.list || [];

    const origLength = user.list.length;
    user.list = user.list.filter(entry => entry.gameName !== gameName);

    if (user.list.length === origLength) {
        return { error: "GAME_NOT_FOUND" };
    }

    const result = await retrySystemInstance.execute(() =>
        client.putDocument({
            db: USERS_DB,
            docId: user._id,
            document: user
        })
    );

    return result.result;
}


// ------------------
// Add a game to the user's list
// ------------------
async function addGameToList(username, gameName, image, slug, status = 0) {
    const user = await getUserByUsername(username);
    if (!user) {
            console.error(`User "${username}" not found`);
            return null;
        }
    user.list = user.list || [];
    if (user.list.some(entry => entry.game === gameName)) {
        return { error: "GAME_ALREADY_EXISTS" };
    }
    user.gamelist.push({
  gameName: gameName,
  image: image,
  slug: slug,
  status: status
});

    const result = await retrySystemInstance.execute(() =>
        client.putDocument({
            db: USERS_DB,
            docId: user._id,
            document: user
        })
    );

    return result.result;
}

// ------------------
// Update game status
// ------------------
async function updateGameStatus(username, gameName, newStatus) {
    const user = await getUserByUsername(username);
    if (!user) {
            console.error(`User "${username}" not found`);
            return null;
        }

    user.list = user.list || [];
    const game = user.list.find(entry => entry.gameName === gameName);
    if (!game) {
        console.error(`Game "${game}" not found`);
        return null;
    }
    game.status = newStatus;
    const result = await retrySystemInstance.execute(() =>
        client.putDocument({
            db: USERS_DB,
            docId: user._id,
            document: user
        })
    );

    return result.result;
}

// ------------------
// Check if game is in list (true/false)
// ------------------
async function gameInList(username, gameName) {
    const user = await getUserByUsername(username);
    if (!user) return false;

    user.list = user.list || [];
    return user.list.some(entry => entry.gameName === gameName);
}

// ------------------
// Get a list of all games a user has
// ------------------
async function getAllGames(username) {
    const user = await getUserByUsername(username);
    if (!user) {
            console.error(`User "${username}" not found`);
            return null;
        }
    user.list = user.list || [];
    return user.list;
}

// ------------------
// Gets all the games from a user with a specific status
// ------------------
async function getGamesByStatus(username, status) {
    const user = await getUserByUsername(username);
    if (!user) {
      console.error(`User "${username}" not found`);
      return null;
    }

    user.list = user.list || [];

    return user.list.filter(entry => entry.status === status);
}

module.exports = {
  getUserId,
  getUsernameById,
  addUser,
  addUserWithEmail,
  getUserById,
  getUserByUsername,
  getEmail,
  userExists,
  validateLogin,
  deleteUser,
  listUsers,
  updateUsername,
  updateEmail,
  updatePassword,
  addGameToList,
  updateGameStatus,
  removeGameFromList,
  gameInList,
  getAllGames,
  getGamesByStatus
};

