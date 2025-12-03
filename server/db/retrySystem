const ExponentialBackoffRetry = require("./ExponentialBackoff");

class RetrySystemCircuitBreaker {
    constructor(options = {}) {
        this.retrier = new ExponentialBackoffRetry(options.retry);
        this.cooldownTime = options.cooldownTime || 10000; // ms
        this.nextAttempt = Date.now();
        this.state = 'CLOSED'; // CLOSED or OPEN
    }

    async execute(fn) {
        // Check if circuit is open
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('CircuitBreaker: OPEN, try later');
            } else {
                // cooldown over, try again
                this.state = 'CLOSED';
                console.log(`Circuit breaker closed`);
            }
        }

        try {
            const result = await this.retrier.execute(fn);
            // Success resets failure count
            return result;
        } catch (err) {
            // Increment failure count
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.cooldownTime;
            console.log(`Circuit breaker OPEN for ${this.cooldownTime}ms`);
            
            throw err;
        }
    }
}

module.exports = { RetrySystem: RetrySystemCircuitBreaker };
