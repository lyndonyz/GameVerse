const {
    getMicroservice,
    getStatus,
    updateServiceStatus
} = require("./serviceRegistryDB");   // adjust path if needed

// Small wait helper
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log("====================================");
    console.log("SERVICE REGISTRY TEST START");
    console.log("====================================\n");

    console.log("Assuming DB already contains:");
    console.log('{"service_name": "auth", "status": "online"}');
    console.log('{"service_name": "games", "status": "offline"}\n');

    // ================================
    // Get Microservice (Valid)
    // ================================
    console.log("\n--- Get Microservice: Valid ---");
    const ms1 = await getMicroservice("Game & Experience Catalog");
    console.log("Game & Experience Catalog:", ms1);

    // ================================
    // Get Microservice (Invalid)
    // ================================
    console.log("\n--- Get Microservice: Invalid ---");
    const msInvalid = await getMicroservice("not_a_service");
    console.log("non-existing:", msInvalid);

    // ================================
    // Get Status
    // ================================
    console.log("\n--- Get Status ---");
    console.log("auth status:", await getStatus("Game & Experience Catalog"));
    console.log("games status:", await getStatus("Analytics & Visualization"));
    console.log("invalid status:", await getStatus("not_a_service"));

    // ================================
    // Update Status (Valid)
    // ================================
    console.log("\n--- Update Status (Valid) ---");
    const update1 = await updateServiceStatus("User Library", "0");
    console.log("Update User Library → 0:", update1);
    await wait(500);

    console.log("auth new status:", await getStatus("User Library"));

    // ================================
    // Update Status (Invalid)
    // ================================
    console.log("\n--- Update Status (Invalid) ---");
    const updateInvalid = await updateServiceStatus("no_service", "1");
    console.log("Update non-existing:", updateInvalid);

    console.log("\n====================================");
    console.log("SERVICE REGISTRY TEST END");
    console.log("====================================");
})();
