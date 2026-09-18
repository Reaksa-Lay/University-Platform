// api-gateway/index.js
const express = require('express');
const httpProxy = require('http-proxy');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Target URLs now come from .env, not hardcoded — same code works locally and on EC2
const REGISTRATION_URL = process.env.REGISTRATION_URL || 'http://localhost:5001';
const LOGIN_URL = process.env.LOGIN_URL || 'http://localhost:5002';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5003';
const USER_URL = process.env.USER_URL || 'http://localhost:5004';

// Public routes - no token needed
app.all('/register/*splat', forwardTo(REGISTRATION_URL));
app.all('/auth/*splat', forwardTo(LOGIN_URL));

// Protected routes - token + role required
app.all('/admin/*splat', verifyToken, requireRole('admin'), forwardTo(ADMIN_URL));
app.all('/user/*splat', verifyToken, requireRole('user'), forwardTo(USER_URL));

app.listen(PORT, () => console.log(`API Gateway running on ${PORT}`));