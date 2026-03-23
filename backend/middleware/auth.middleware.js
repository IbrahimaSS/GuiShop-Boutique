const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  
  // 2. Check Query String (with more robust detection)
  if (!token || token === 'null' || token === 'undefined') {
    // Try standard Express query parsing
    if (req.query && req.query.token) {
      token = req.query.token;
    } 
    // Manual fallback if query is not parsed for some reason
    else if (req.originalUrl.includes('?token=')) {
      const urlParts = req.originalUrl.split('?token=');
      if (urlParts.length > 1) {
        token = urlParts[1].split('&')[0];
      }
    }
  }

  // DEBUG LOG
  console.log(`[AUTH-DEBUG] Path: ${req.path}, Method: ${req.method}, Token Found: ${token ? 'YES (starts with ' + token.substring(0, 10) + '...)' : 'NO'}`);

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('[AUTH-ERROR]:', error.message);
      res.status(401).json({ success: false, error: 'Session expirée ou invalide' });
    }
  } else {
    res.status(401).json({ success: false, error: 'Accès non autorisé, pas de jeton' });
  }
};

const admin = (req, res, next) => {
  console.info(`[DEBUG-AUTH] Tentative d'accès - User: ${req.user ? req.user.email : 'Inconnu'}, Role: ${req.user ? req.user.role : 'Inexistant'}`);
  
  const userRole = req.user && req.user.role ? req.user.role : '';
  const isAllowed = 
    userRole === 'admin' || 
    userRole === 'manager' || 
    userRole.toLowerCase() === 'super-admin' ||
    userRole.toLowerCase() === 'super admin' ||
    userRole.toLowerCase() === 'superadmin';

  if (isAllowed) {
    console.info(`[DEBUG-AUTH] Accès ACCORDÉ pour le rôle: ${userRole}`);
    next();
  } else {
    console.warn(`[DEBUG-AUTH] Accès REFUSÉ - Rôle '${userRole}' non autorisé`);
    res.status(403).json({ success: false, error: `Accès réservé (Rôle: ${userRole})` });
  }
};

module.exports = { protect, admin };
