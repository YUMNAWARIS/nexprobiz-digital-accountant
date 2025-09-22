const yup = require('yup');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const createBusinessSchema = yup.object({
    name: yup.string().trim().min(2).max(255).required('Business name is required'),
    email: yup.string().email('Invalid business email').required('Business email is required'),
    user_email: yup.string().email('Invalid user email').required('User email is required'),
    password: yup.string()
        .matches(passwordRegex, 'Password must be 8+ chars, include upper, lower, digit')
        .required('Password is required'),
}).noUnknown(true, 'Unknown field: ${unknown}');

module.exports = {
    createBusinessSchema,
};

// Update business: allow changing name, business email, and optionally admin password.
// User email cannot be changed, so it is not included and unknown fields are rejected.
const updateBusinessSchema = yup.object({
    name: yup.string().trim().min(2).max(255).required('Business name is required'),
    email: yup.string().email('Invalid business email').required('Business email is required'),
    password: yup.string()
        .transform((value) => (value === '' ? undefined : value))
        .matches(passwordRegex, 'Password must be 8+ chars, include upper, lower, digit')
        .notRequired(),
}).noUnknown(true, 'Unknown field: ${unknown}');

module.exports.updateBusinessSchema = updateBusinessSchema;


