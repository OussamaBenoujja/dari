const AuthService = require('../services/AuthService');
const validator = require('../utils/validator');

const authService = new AuthService();

async function authMiddleware(req, res, next){
	const authHeader = req.headers ? req.headers.authorization : null;
	if(!validator.isNonEmptyString(authHeader)){
		return res.status(401).json({ message: 'Authorization header is missing' });
	}

	const parts = authHeader.split(' ');
	if(parts.length !== 2 || parts[0] !== 'Bearer'){
		return res.status(401).json({ message: 'Authorization header is not valid' });
	}

	const token = parts[1];
	const result = authService.verifyToken(token);
	if(!result.valid){
		return res.status(401).json({ message: 'Token is not valid' });
	}

	req.user = result.payload;
	return next();
}

function isAdmin(req, res, next) {
	if (req.user && req.user.role === 'admin') {
		return next();
	}
	return res.status(403).json({ message: 'Admin access required' });
}

module.exports = authMiddleware;
module.exports.isAdmin = isAdmin;
