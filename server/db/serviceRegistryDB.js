const { client, SERVICE_REGISTRY_DB } = require("./db");
const { RetrySystem } = require("./retrySystem");

const retrySystemInstance = new RetrySystem({
    retry: {
        maxRetries: 5,      
        minimumDelay: 300,  
        maxDelay: 3000  
    },
});


async function getMicroservice(_microservice) {
    try {
        const response = await retrySystemInstance.execute(() =>
            client.postFind({
                db: SERVICE_REGISTRY_DB,
                selector: { service_name: { $regex: `(?i)^${_microservice}$` } },
                limit: 1
            })
        );
        return response.result.docs[0] || null;
    } catch (err) {
        console.log(err.message);
        return false;
    }
}

async function getStatus(_microservice) {
    try {
        const ms = await getMicroservice(_microservice);
        return ms?.status || null;
    } catch (err) {
        console.log(err.message);
        return false;
    }
}

async function updateServiceStatus(_microservice, _newstatus) {
    const ms = await getMicroservice(_microservice);
    if (!ms) {
            console.error(`Microservice "${_microservice}" not found`);
            return null;
        }

    const updatedDoc = { ...ms, status: _newstatus };
     const updateResponse = await client.putDocument({
            db: SERVICE_REGISTRY_DB,
            docId: ms._id,
            document: updatedDoc
        });

    return updateResponse.result;
}
module.exports = {
    getMicroservice,
    getStatus,
    updateServiceStatus
};

