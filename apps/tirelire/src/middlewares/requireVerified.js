const UserService = require('../services/UserService');

const userService = new UserService();

async function requireVerified(req, res, next){
    const payload = req.user;
    if(!payload){
        return res.status(401).json({ message: 'User is not authenticated' });
    }
    try {
        // try by email, then by preferred_username
        const email = payload.email || payload.preferred_username;
        if(!email){
            return res.status(401).json({ message: 'Token missing email/username' });
        }
        let user = await userService.getUserByEmail(email);
        // auto-create a local profile if not exists (simple)
        if(!user){
            const names = (payload.name || '').split(' ');
            const first = payload.given_name || names[0] || 'user';
            const last = payload.family_name || names.slice(1).join(' ') || 'kc';
            const rnd = Math.random().toString(36).slice(2);
            user = await userService.createUser(first, last, email, 'unknown', rnd, 'user');
        }
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        if(!user.isVerified){
            return res.status(403).json({ message: 'User must be verified to perform this action' });
        }
        req.authUser = user;
        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = requireVerified;
