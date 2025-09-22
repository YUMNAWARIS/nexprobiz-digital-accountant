const masterStatsModel = require('../models/masterStats');

async function getStats() {
    const userCounts = await masterStatsModel.getMasterStats();
    const businessCount = await masterStatsModel.getMasterBusinessCount();

    const countsByStatus = userCounts.reduce((acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
    }, {});

    const stats = {
        users: {
            active: countsByStatus.active || 0,
            inactive: countsByStatus.inactive || 0,
            blocked: countsByStatus.blocked || 0,
            deleted: countsByStatus.deleted || 0,
            locked: countsByStatus.locked || 0,
            total: Object.values(countsByStatus).reduce((sum, val) => sum + Number(val || 0), 0),
        },
        businesses: Number(businessCount?.count || 0),
    };

    return stats;
}

module.exports = {
    getStats,
};


