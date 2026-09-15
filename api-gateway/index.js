// api-gateway/index.js
const express = require('express');
const httpProxy = require('http-proxy');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 5000;

const proxy = httpProxy.createProxyServer();

// ---- Middleware: verify JWT ----
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  });
}

// ---- Middleware: check role ----
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied: requires ${role} role` });
    }
    next();
  };
}

// ---- Helper to forward the request after checks pass ----
function forwardTo(target) {
  return (req, res) => {
    proxy.web(req, res, { target }, (err) => {
      res.status(502).json({ error: `${target} unavailable` });
    });
  };
}

// Public routes - no token needed
app.all('/register/*splat', forwardTo('http://localhost:5001'));
app.all('/auth/*splat', forwardTo('http://localhost:5002'));

// Protected routes - token + role required
app.all('/admin/*splat', verifyToken, requireRole('admin'), forwardTo('http://localhost:5003'));
app.all('/user/*splat', verifyToken, requireRole('user'), forwardTo('http://localhost:5004'));

app.listen(PORT, () => console.log(`API Gateway running on ${PORT}`));