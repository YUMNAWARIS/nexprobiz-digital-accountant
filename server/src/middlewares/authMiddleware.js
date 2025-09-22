const { verifyToken } = require('../utilities/jwt');
const CustomError = require('../utilities/errors');


const authenticate = ({ token }) => {
    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            throw new CustomError(401, 'Invalid authorization header provided');
        }
        return decoded;
    } catch (error) {
        throw new CustomError(401, error.message);
    }
}

const authorize = ({ user, route_permissions = [] }) => {
    if (route_permissions.includes('any')) {
        return true;
    }
    if (route_permissions.includes(user.role)) {
        return true;
    }
    throw new CustomError(403, 'You are not authorized to access this resource');
}

module.exports = ({ route_permissions = ['any'] }) => {
    return (req, res, next) => {

        if (route_permissions.includes('any')) {
            return next();
        }

        // Authenticate the user
        const authHeader = req.headers?.authorization;
        if (!authHeader) {
            throw new CustomError(401, 'No authorization header provided');
        }

        const [type, token] = authHeader.split(' ');

        if (type === 'Bearer') {
            const user = authenticate({ token });
            authorize({ user, route_permissions });
            req.user = user;
            req.business_id = user.business_id || null;
            return next();
        } else {
            throw new CustomError(401, 'Invalid authorization header type');
        }

    }
}
