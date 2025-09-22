const { comparePassword, generateToken } = require('../utilities/jwt');
const CustomError = require('../utilities/errors');
const userModel = require('../models/userModel');

async function login({ email, password }) {
    if (!email || !password) {
        throw new CustomError({ statusCode: 400, message: 'email and password are required' });
    }

    const user = await userModel.findByEmail({ email });
    if (!user) {
        throw new CustomError({ statusCode: 401, message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
        throw new CustomError({ statusCode: 401, message: 'Invalid credentials' });
    }

    if (user.status && user.status !== 'active') {
        throw new CustomError({ statusCode: 403, message: 'User is not active' });
    }

    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
    };

    const token = generateToken(payload);

    // avoid returning password
    return { token, user: payload };
}

module.exports = {
    login,
};


