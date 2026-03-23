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

// Autoriser certains rôles spécifiques
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(`[AUTH-DENIED] Tentative d'accès REFUSÉ - User: ${req.user ? req.user.email : 'Inconnu'}, Role: ${req.user ? req.user.role : 'Aucun'}, Requis: [${roles}]`);
      return res.status(403).json({ 
        success: false, 
        error: `Accès refusé : votre rôle (${req.user ? req.user.role : 'inconnu'}) n'autorise pas cette action.` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
