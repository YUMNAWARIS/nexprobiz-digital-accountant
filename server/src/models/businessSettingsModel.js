const db = require('../configs/db');

/**
 * Fetch all settings for a business
 */
const getSettingsForBusiness = async ({ business_id }) => {
    const rows = await db('business_settings')
        .select('id', 'key', 'value', 'business_id', 'created_at', 'updated_at')
        .where({ business_id })
        .orderBy('key', 'asc');
    return rows;
};

/**
 * Upsert a single setting for a business
 * If (business_id, key) exists, update value; otherwise insert new.
 */
const upsertSetting = async ({ business_id, key, value }, trx = null) => {
    const qb = trx || db;
    // Use Postgres onConflict for atomic upsert
    const [row] = await qb('business_settings')
        .insert({ business_id, key, value })
        .onConflict(['business_id', 'key'])
        .merge({ value, updated_at: qb.fn.now() })
        .returning(['id', 'key', 'value', 'business_id', 'created_at', 'updated_at']);
    return row;
};

/**
 * Batch upsert settings for a business
 */
const upsertSettingsBatch = async (rowsToInsert, trx = null) => {
    if (!Array.isArray(rowsToInsert) || rowsToInsert.length === 0) {
        return [];
    }
    const qb = trx || db;
    const rows = await qb('business_settings')
        .insert(rowsToInsert)
        .onConflict(['business_id', 'key'])
        .merge({ value: qb.raw('excluded.value'), updated_at: qb.fn.now() })
        .returning(['id', 'key', 'value', 'business_id', 'created_at', 'updated_at']);
    return rows;
};

module.exports = {
    getSettingsForBusiness,
    upsertSetting,
    upsertSettingsBatch,
};


