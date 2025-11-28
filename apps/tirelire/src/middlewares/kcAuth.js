const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { issuer } = require('../config/keycloak');

const client = jwksClient({ jwksUri: `${issuer()}/protocol/openid-connect/certs` });

function getKey(header, cb){
  client.getSigningKey(header.kid, (err, key) => {
    if(err) return cb(err);
    cb(null, key.getPublicKey());
  });
}

function kcAuth(req, res, next){
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ message: 'no token' });
  const token = parts[1];
  jwt.verify(token, getKey, { algorithms: ['RS256'], issuer: issuer() }, (err, decoded) => {
    if(err) return res.status(401).json({ message: 'bad token' });
    req.user = decoded; // keycloak payload
    next();
  });
}

module.exports = kcAuth;