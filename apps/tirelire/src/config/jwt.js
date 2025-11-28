const crypto = require('crypto');


const secretKey = process.env.JWT_SECRET_KEY;


function bs64url(str){
    let strb64 = Buffer.from(str).toString("base64");
    return strb64url = strb64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBase64(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return b64;
}

function bs64urlToString(base64url){
    const standardBase64 = base64urlToBase64(base64url);
    const originalString = Buffer.from(standardBase64, 'base64').toString();
    return originalString;
}

function createJWT(email,exp = process.env.JWT_EXPIRES_IN){
        const header = {
            alg:'hs256',
            type : 'JWT',
        };

        const payload = {
            email: email,
            exp: exp + Math.floor(Date.now() / 1000)
        };

        const signature = crypto.createHmac('sha256', secretKey)
                   .update(bs64url(JSON.stringify(header)) + '.' + bs64url(JSON.stringify(payload)))
                   .digest('base64url');

        return bs64url(JSON.stringify(header)) +'.'+ bs64url(JSON.stringify(payload)) +'.'+ signature;
}

function verifyJWT(token){
    let arr = token.split('.');
    if(arr.length !== 3) return false; 
    let header = bs64urlToString(arr[0]);
    let payload = bs64urlToString(arr[1]);
    let signature = arr[2];
    const signatureF = crypto.createHmac('sha256', secretKey)
                   .update(arr[0] + '.' + arr[1])
                   .digest('base64url');
    if(signatureF == signature){
        payload = JSON.parse(payload);
        if(payload.exp<Math.floor(Date.now() / 1000)){
            return false;
        }else{return true}
    }else{return false}
    
}

function decodeJWT(token) {
    const parts = token.split('.');
    if(parts.length !== 3) return null;

    const payload = bs64urlToString(parts[1]);
    try {
        return JSON.parse(payload);
    } catch {
        return null;
    }
}


module.exports = {createJWT, verifyJWT, decodeJWT};