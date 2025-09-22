const masterStatsService = require('../../services/masterStats');

async function getStats(req, res, next) {
    try {
        const stats = await masterStatsService.getStats();
        res.status(200).json({
            message: 'Master stats fetched successfully',
            stats,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStats,
};
