const ExponentialBackoffRetry = require("./ExponentialBackoff");


// failureTypes = {user_db_fail, comment_db_fail, game_api_fail  };


class RetrySystemCircuitBreaker {
    
    constructor(options = {}) {
        this.retrier = new ExponentialBackoffRetry(options.retry);
        this.cooldownTime = options.cooldownTime || 10000; // ms
        this.nextAttempt = Date.now();
        this.state = 'CLOSED'; // CLOSED or OPEN
        this.failureType = options.failureType || "";
    }
    getServiceRegistry() {
        return require("./serviceRegistry");
    }

    async execute(fn) {
        // Check if circuit is open
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('CircuitBreaker: OPEN, try later');
            } else {
                // cooldown over, try again

                this.state = 'CLOSED';
                const serviceRegistry = this.getServiceRegistry();
                switch (this.failureType) {
                    case 'user_db_fail':
                        serviceRegistry.turnOnUserLibrary();
                        break;
                    case 'comment_db_fail':
                        serviceRegistry.turnOnFeedbackService();
                        break;
                    case 'game_api_fail':
                        serviceRegistry.turnOnSearchCategory();
                        serviceRegistry.turnOnGameCatalog();
                        serviceRegistry.turnOnAnalytics();
                        break;
                    default:
                console.warn(`No actions defined for failure type: ${this.failureType}`);
                }
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

            const serviceRegistry = this.getServiceRegistry();
            
            switch (this.failureType) {
            case 'user_db_fail':
                serviceRegistry.turnOffUserLibrary();
                break;
            case 'comment_db_fail':
                serviceRegistry.turnOffFeedbackService();
                break;
            case 'game_api_fail':
                serviceRegistry.turnOffSearchCategory();
                serviceRegistry.turnOffGameCatalog();
                serviceRegistry.turnOffAnalytics();
                break;
            default:
            console.warn(`No actions defined for failure type: ${this.failureType}`);
                }           
            throw err;
        }
    }
}

module.exports = { RetrySystem: RetrySystemCircuitBreaker };
