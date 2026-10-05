exports.getPage = ({ page = 1, limit = 20 } = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

exports.pageResult = (data, total, { page, limit }) => ({
  data,
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});
