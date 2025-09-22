module.exports = (err, req, res, next) => {
    // Preserve existing validation error response shape
    if (err && err.name === 'ValidationError') {
        const errors = {};
        if (err.inner && Array.isArray(err.inner)) {
            for (const e of err.inner) {
                if (e.path && !errors[e.path]) {
                    errors[e.path] = e.message;
                }
            }
        }
        return res.status(400).json({
            message: 'Validation failed',
            errors: Object.keys(errors).length ? errors : err.message,
        });
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let details = err.details || null;
    let name = err.name || 'Internal server error';

    return res.status(statusCode).json({
        error: 'true',
        message,
        details,
        name
    });
};
