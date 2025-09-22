const db = require('../configs/db');
const businessSettingsModel = require('../models/businessSettingsModel');

async function getAllSettings({ business_id }) {
    const rows = await businessSettingsModel.getSettingsForBusiness({ business_id });
    return rows.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {});
}

async function updateSetting({ id, settings }) {
    const rowsToInsert = settings.map(({ key, value }) => ({ business_id: id, key, value }));
    return db.transaction(async (trx) => {
        const updated = await businessSettingsModel.upsertSettingsBatch(rowsToInsert, trx);
        return updated;
    });
}


module.exports = {
    getAllSettings,
    updateSetting,
};


