const businessSettingsService = require('../../services/businessSettingsService');

async function getSettings(req, res, next) {
    try {
        const { id } = req.params;
        const settings = await businessSettingsService.getAllSettings({ business_id: id });
        res.status(200).json({ message: 'Settings fetched successfully', settings });
    } catch (err) {
        next(err);
    }
}

async function updateSetting(req, res, next) {
    try {
        const { id } = req.params;
        const { settings } = req.body;
        // Convert settings to array of objects
        const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
        if (settingsArray.length === 0) {
            return res.status(200);
        }
        const updated = await businessSettingsService.updateSetting({ id, settings: settingsArray });
        return res.status(200).json({ message: 'Setting updated successfully', setting: updated });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getSettings,
    updateSetting,
};


