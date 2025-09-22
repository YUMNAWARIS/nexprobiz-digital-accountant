const businessModel = require('../models/businessModel');
const userModel = require('../models/userModel');
const db = require('../configs/db');
const { hashPassword } = require('../utilities/jwt');

async function getAllBusinesses({ query = {} }) {
    const { page = 1, limit = 10 } = query;
    return businessModel.getAllBusinesses({ page, limit, search: query.search });
}

async function getBusinessById({ id }) {
    const business = await businessModel.getBusinessById({ id });
    return business;
}

async function createBusiness({ name, email, user_email, password }) {
    return db.transaction(async (trx) => {
        const business = await trx
            .insert({ name, email })
            .into('businesses')
            .returning(['id', 'name', 'email', 'created_at', 'updated_at'])
            .then(rows => rows[0]);

        const hashedPassword = await hashPassword(password);
        const username = name;
        const user = await userModel.createUser({
            username,
            email: user_email,
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            business_id: business.id,
        }, trx);

        return { business, user };
    });
}

async function updateBusiness({ id, name, email, password }) {
    return db.transaction(async (trx) => {
        // Update business details
        const updatedBusiness = await businessModel.updateBusiness({ id, name, email }, trx);

        // If password provided, update admin user's password for this business
        if (password) {
            const hashedPassword = await hashPassword(password);
            await userModel.updateAdminPasswordForBusiness({ business_id: id, password: hashedPassword }, trx);
        }

        return { business: updatedBusiness };
    });
}

module.exports = {
    getAllBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
};

