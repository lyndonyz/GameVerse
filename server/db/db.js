const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { CloudantV1 } = require("@ibm-cloud/cloudant");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");

const client = CloudantV1.newInstance({
  authenticator: new IamAuthenticator({
    apikey: process.env.CLOUDANT_APIKEY
  })
});

client.setServiceUrl(process.env.CLOUDANT_URL);
 
module.exports = {
  client,
  USERS_DB: "gameverse-users-db",
  COMMENTS_DB: "gameverse-comments-db",
  SERVICE_REGISTRY_DB: "gameverse-service-registry"
};
