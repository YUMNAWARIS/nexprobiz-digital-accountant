exports.paginate = async ({ page = 1, limit = 10, query } = {}) => {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;

    // Data query (with pagination)
    const dataQuery = query.clone().offset((pageNumber - 1) * limitNumber).limit(limitNumber);
    const rows = await dataQuery;

    // Count query (clear selects and ordering)
    const countRow = await query
        .clone()
        .clearSelect()
        .clearOrder()
        .count({ count: '*' })
        .first();

    const total = Number(countRow && (countRow.count || countRow['count(*)'])) || 0;

    return {
        data: rows,
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            total_pages: Math.max(1, Math.ceil(total / limitNumber)),
        }
    };
}