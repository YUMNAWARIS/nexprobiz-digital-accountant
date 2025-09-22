// Reusable request body validator using Yup schema
module.exports = function validate(schema) {
    return async function validateMiddleware(req, res, next) {
        try {
            const validated = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
            req.body = validated;
            return next();
        } catch (validationError) {
            const errors = {};
            if (validationError.inner && Array.isArray(validationError.inner)) {
                for (const err of validationError.inner) {
                    if (err.path && !errors[err.path]) {
                        errors[err.path] = err.message;
                    }
                }
            }
            return res.status(400).json({
                message: 'Validation failed',
                errors: Object.keys(errors).length ? errors : validationError.message,
            });
        }
    }
}

