const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'C41CF281DC';

const protect = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Accès refusé. Token Bearer manquant.'
        });
    }

    const token = authorizationHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token invalide ou expiré.'
        });
    }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Accès refusé. Utilisateur non authentifié.'
        });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            message: 'Accès interdit. Rôle insuffisant.'
        });
    }

    return next();
};

module.exports = {
    protect,
    authorizeRoles
};