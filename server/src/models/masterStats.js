const db = require('../configs/db');

const getMasterStats = async () => {
    const stats = await db('users')
        .select('status')
        .count('* as count')
        .groupBy('status');
    return stats;
}

const getMasterBusinessCount = async () => {
    const stats = await db('businesses')
        .count('* as count');
    return stats?.[0];
}

module.exports = {
    getMasterStats,
    getMasterBusinessCount,
}