/**
 * Pagination utility — consistent cursor-offset pagination across all endpoints
 *
 * Usage in controllers:
 *   const { skip, take, page, limit } = parsePagination(req.query);
 *   const { data, pagination } = buildPaginatedResponse(items, total, page, limit);
 */

/**
 * Parse pagination query params
 * @param {Object} query - req.query
 * @param {number} defaultLimit - default items per page
 * @param {number} maxLimit - max items per page
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
export const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
};

/**
 * Parse sort query params
 * @param {Object} query - req.query
 * @param {string[]} allowedFields - fields that can be sorted on
 * @param {string} defaultField - default sort field
 * @returns {{ orderBy: Object }}
 */
export const parseSorting = (
  query,
  allowedFields = ["createdAt"],
  defaultField = "createdAt"
) => {
  const sortBy =
    query.sortBy && allowedFields.includes(query.sortBy)
      ? query.sortBy
      : defaultField;
  const order = query.order === "asc" ? "asc" : "desc";

  return { orderBy: { [sortBy]: order } };
};

/**
 * Build a paginated response object
 * @param {Array} data - the page of results
 * @param {number} total - total count of matching records
 * @param {number} page - current page
 * @param {number} limit - items per page
 * @returns {{ data: Array, pagination: Object }}
 */
export const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
