const { RetrySystem } = require("./db/retrySystem");

const retrySystemInstance = new RetrySystem({
  retry: {
    maxRetries: 5,
    minimumDelay: 200,
    maxDelay: 2500,
  },
  failureType: "game_api_fail"
});

async function retryFetch(url, options = {}) {
  return retrySystemInstance.execute(async () => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    return res.json();
  });
}

module.exports = { retryFetch };