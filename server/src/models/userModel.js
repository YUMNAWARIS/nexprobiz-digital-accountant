const db = require('../configs/db');

async function findByEmail({ email }) {
    return db('users')
        .orWhere({ email })
        .first();
}

async function createUser({ username, email, password, role = 'admin', status = 'active', business_id = null }, trx = null) {
    const queryBuilder = trx || db;
    const [inserted] = await queryBuilder('users')
        .insert({ username, email, password, role, status, business_id })
        .returning(['id', 'username', 'email', 'role', 'status', 'business_id', 'created_at', 'updated_at']);
    return inserted;
}

module.exports = {
    findByEmail,
    createUser,
};

async function updateAdminPasswordForBusiness({ business_id, password }, trx = null) {
    const queryBuilder = trx || db;
    await queryBuilder('users')
        .where({ business_id, role: 'admin' })
        .update({ password });
}

module.exports.updateAdminPasswordForBusiness = updateAdminPasswordForBusiness;


