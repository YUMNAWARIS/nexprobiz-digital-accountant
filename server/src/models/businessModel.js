const db = require('../configs/db');
const { paginate } = require('../utilities/pagination');

/**
 * Fetch businesses list with optional search and pagination
 */
const getAllBusinesses = async ({ page = 1, limit = 10, search } = {}) => {
    const query = db('businesses')
        .select('id', 'name', 'email', 'data', 'created_at', 'updated_at');
    if (search && String(search).trim().length) {
        query.where((qb) => {
            qb.whereILike('name', `%${search}%`)
              .orWhereILike('email', `%${search}%`);
        });
    }
    query.orderBy('created_at', 'desc');
    return await paginate({ page, limit, query });
};

/**
 * Fetch a single business by id
 */
const getBusinessById = async ({ id }) => {
    return db('businesses')
        .select('id', 'name', 'email', 'data', 'created_at', 'updated_at')
        .where({ id })
        .first();
};

/**
 * Insert a new business
 */
const createBusiness = async ({ name, email, data = {} }) => {
    const [inserted] = await db('businesses')
        .insert({ name, email, data })
        .returning(['id', 'name', 'email', 'data', 'created_at', 'updated_at']);
    return inserted;
};

/**
 * Update an existing business by id
 */
const updateBusiness = async ({ id, name, email }, trx = null) => {
    const queryBuilder = trx || db;
    const [updated] = await queryBuilder('businesses')
        .where({ id })
        .update({ name, email })
        .returning(['id', 'name', 'email', 'data', 'created_at', 'updated_at']);
    return updated;
};

module.exports = {
    getAllBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
};


