require("dotenv").config();

const { CloudantV1 } = require("@ibm-cloud/cloudant");
const { IamAuthenticator } = require("ibm-cloud-sdk-core"); 
const client = CloudantV1.newInstance({
  authenticator: new IamAuthenticator({
    apikey: process.env.CLOUDANT_APIKEY
  })
});
client.setServiceUrl(process.env.CLOUDANT_URL);

module.exports = { client };


// ------------------
// Add a document
// ------------------
async function addDoc(dbName, doc) {
  try {
    const response = await client.postDocument({ db: dbName, document: doc });
    return response.result; // contains id and rev
  } catch (err) {
    console.error("Error adding document:", err);
  }
}

// ------------------
// Search / get a document by ID
// ------------------
async function getDocById(dbName, id) {
  try {
    const response = await client.getDocument({ db: dbName, docId: id });
    return response.result;
  } catch (err) {
    console.error("Error getting document:", err);
  }
}

// ------------------
// Search / get a document by field
// ------------------

async function findDocByField(dbName, field, value) {
  try {
    const response = await client.postFind({
      db: dbName,
      selector: {
        [field]: value
      },
      limit: 1
    });

    return response.result.docs[0] || null;
  } catch (err) {
    console.error("Error finding document:", err);
  }
}

// ------------------
// Edit / update a document
// ------------------
async function updateDoc(dbName, doc) {
  // doc must include _id and _rev
  try {
    const response = await client.putDocument({ db: dbName, docId: doc._id, document: doc });
    return response.result;
  } catch (err) {
    console.error("Error updating document:", err);
  }
}

// ------------------
// Remove a document
// ------------------
async function deleteDoc(dbName, id, rev) {
  try {
    const response = await client.deleteDocument({ db: dbName, docId: id, rev });
    return response.result;
  } catch (err) {
    console.error("Error deleting document:", err);
  }
}

// ------------------
// List documents
// ------------------
async function listDbDocuments(dbName, limit = 5) {
  try {
    // Check if the database exists
    const dbInfo = await client.getDatabaseInformation({ db: dbName });
    console.log(`Database "${dbName}" info:`);
    console.log(dbInfo.result);

    // Fetch documents
    const docs = await client.postAllDocs({
      db: dbName,
      includeDocs: true,
      limit
    });

    console.log(`Sample documents from "${dbName}":`);
    console.log(docs.result.rows);
  } catch (err) {
    console.error(`Error accessing database "${dbName}":`, err);
  }
}


module.exports = { addDoc, getDocById, updateDoc, deleteDoc, findDocByField, listDbDocuments };