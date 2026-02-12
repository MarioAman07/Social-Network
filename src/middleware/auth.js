// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { userId, role, username, iat, exp }
    req.user = payload;
    req.userId = payload.userId;//shortcut
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

module.exports = auth;
