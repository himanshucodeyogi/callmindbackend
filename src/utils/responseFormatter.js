const ok = (res, data, status = 200) => res.status(status).json(data);

const fail = (res, message, status = 400) =>
  res.status(status).json({ error: message });

module.exports = { ok, fail };
