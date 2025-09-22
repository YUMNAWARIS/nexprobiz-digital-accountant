class CustomError extends Error {
    constructor({
        statusCode = 500,
        message = 'Internal Server Error',
        details,
        name = 'Custom Error'
    }) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
        if (details) {
            this.details = details;
        }
        Error.captureStackTrace?.(this, CustomError);
    }
}

module.exports = CustomError;


