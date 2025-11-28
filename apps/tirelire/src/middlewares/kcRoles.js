function isAdmin(req, res, next){
  const u = req.user || {};
  const roles = (u.realm_access && u.realm_access.roles) || [];
  if(roles.includes('admin')) return next();
  return res.status(403).json({ message: 'Admin access required' });
}

module.exports = { isAdmin };
