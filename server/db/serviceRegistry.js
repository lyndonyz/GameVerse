const {
    getMicroservice,
    getStatus,
    updateServiceStatus
} = require("./serviceRegistryDB");

const MICROSERVICES = {
    SEARCH_CATEGORY: "Search & Category Filter",
    USER_LIBRARY: "User Library",
    GAME_CATALOG: "Game & Experience Catalog",
    ANALYTICS: "Analytics & Visualization",
    FEEDBACK: "User Feedback & Rating Service",
};

async function initializeAllServices() {
    (async () => {
        await new Promise (res => setTimeout(res, 1000));
        console.log("\nInitializing Service Registry...");

        for (const key in MICROSERVICES) {
            const name = MICROSERVICES[key];
            const status = await getStatus(name);
            console.log(`-> ${name}: ${Number(status) == 1 ? "ACTIVE" : "INACTIVE"}` );
        }
        console.log("Service Registry Initialization Complete.");
    })();
    
}


async function setServiceStatus(serviceName, status) {
    const updated = await updateServiceStatus(serviceName, status);
    if (!updated) {
        console.error(`Failed to update service: ${serviceName}`);
        return null;
    }

    console.log(
        `${serviceName} has been turned ${status === 1 ? "ON" : "OFF"}`
    );
    return updated;
}

// --------------------------------------
// Placeholder logic when turning OFF services
// --------------------------------------
function placeholderAction(serviceName) {
    console.log( `uhhhh this is a placeholder` );
}

// ------------------
// Handling Services Seperately
// ------------------

/* SEARCH & CATEGORY FILTER */
async function turnOffSearchCategory() {
    await setServiceStatus(MICROSERVICES.SEARCH_CATEGORY, 0);
    placeholderAction(MICROSERVICES.SEARCH_CATEGORY);
}
async function turnOnSearchCategory() {
    await setServiceStatus(MICROSERVICES.SEARCH_CATEGORY, 1);
    placeholderAction(MICROSERVICES.USER_LIBRARY);
}

/* USER LIBRARY */
async function turnOffUserLibrary() {
    await setServiceStatus(MICROSERVICES.USER_LIBRARY, 0);
    placeholderAction(MICROSERVICES.USER_LIBRARY);
}
async function turnOnUserLibrary() {
    await setServiceStatus(MICROSERVICES.USER_LIBRARY, 1);
    placeholderAction(MICROSERVICES.USER_LIBRARY);
}

/* GAME & EXPERIENCE CATALOG */
async function turnOffGameCatalog() {
    await setServiceStatus(MICROSERVICES.GAME_CATALOG, 0);
    placeholderAction(MICROSERVICES.GAME_CATALOG);
}
async function turnOnGameCatalog() {
    await setServiceStatus(MICROSERVICES.GAME_CATALOG, 1);
    placeholderAction(MICROSERVICES.USER_LIBRARY);
}

/* ANALYTICS & VISUALIZATION */
async function turnOffAnalytics() {
    await setServiceStatus(MICROSERVICES.ANALYTICS, 0);
    placeholderAction(MICROSERVICES.ANALYTICS);
}
async function turnOnAnalytics() {
    await setServiceStatus(MICROSERVICES.ANALYTICS, 1);
    placeholderAction(MICROSERVICES.USER_LIBRARY);
}

/* USER FEEDBACK & RATING SERVICE */
async function turnOffFeedbackService() {
    await setServiceStatus(MICROSERVICES.FEEDBACK, 0);
    placeholderAction(MICROSERVICES.FEEDBACK);
}
async function turnOnFeedbackService() {
    await setServiceStatus(MICROSERVICES.FEEDBACK, 1);
    placeholderAction(MICROSERVICES.USER_LIBRARY);
}


module.exports = {
    initializeAllServices,

    turnOffSearchCategory,
    turnOnSearchCategory,

    turnOffUserLibrary,
    turnOnUserLibrary,

    turnOffGameCatalog,
    turnOnGameCatalog,

    turnOffAnalytics,
    turnOnAnalytics,

    turnOffFeedbackService,
    turnOnFeedbackService,

    MICROSERVICES
};
