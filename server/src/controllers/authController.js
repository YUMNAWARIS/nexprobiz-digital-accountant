const authService = require('../services/authService');

async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};
        const result = await authService.login({ email, password });
        res.status(200).json({
            message: 'Login successful',
            token: result.token,
            user: result.user
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    login,
};


