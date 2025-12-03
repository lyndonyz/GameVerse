class ExponentialBackoffRetry {
    constructor(options = {}) {
        this.minimumDelay = options.baseDelay || 500;
        this.maxDelay = options.maxDelay || 20000;
        this.maxRetries = options.maxRetries || 5;
        
    }

    async execute(fn) {
        let retries = 0;
        while (true) {
            try {
                return await fn();
            } catch (error) {
                
                if (retries >= this.maxRetries) throw new Error(`Failed after ${retries} retries: ${error.message}`);
                let delay = Math.min(this.minimumDelay * Math.pow(2, retries), this.maxDelay);
                await this.wait(delay);
                retries++;
                console.log("Attempt #", retries, " failed: Too Many Requests. Retrying in", delay, "ms...");
            }
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ExponentialBackoffRetry; 
