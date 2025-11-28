const UserService = require('./UserService');
const jwtHelper = require('../config/jwt');
const validator = require('../utils/validator');

class AuthService {
    constructor(){
        this.userService = new UserService();
    }

    async register(data){
        const payload = data || {};
        const errors = validator.validateRegisterInputs(payload);
        if(Object.keys(errors).length > 0){
            const error = new Error('Validation failed');
            error.details = errors;
            throw error;
        }

        const existing = await this.userService.getUserByEmail(payload.email);
        if(existing){
            throw new Error('Email already registered');
        }

        const user = await this.userService.createUser(
            payload.first_Name,
            payload.last_Name,
            payload.email,
            payload.adress,
            payload.password,
            payload.role || 'user'
        );

        const token = jwtHelper.createJWT(user.email);
        const userData = user.toObject ? user.toObject() : user;
        delete userData.password;

        return {
            token: token,
            user: userData
        };
    }

    async login(email, password){
        const errors = validator.validateLoginInputs(email, password);
        if(Object.keys(errors).length > 0){
            const error = new Error('Validation failed');
            error.details = errors;
            throw error;
        }

        const user = await this.userService.getUserByEmail(email, { includePassword: true });
        if(!user){
            throw new Error('User not found');
        }

        const isValid = await user.comparePassword(password);
        if(!isValid){
            throw new Error('Invalid password');
        }

        const token = jwtHelper.createJWT(user.email);
        const userData = user.toObject ? user.toObject() : user;
        delete userData.password;

        return {
            token: token,
            user: userData
        };
    }

    logout(){
        return { message: 'Logged out' };
    }

    verifyToken(token){
        if(!validator.isNonEmptyString(token)){
            return { valid: false };
        }
        const isValid = jwtHelper.verifyJWT(token);
        if(!isValid){
            return { valid: false };
        }
        const payload = jwtHelper.decodeJWT(token);
        return {
            valid: true,
            payload: payload
        };
    }
}

module.exports = AuthService;
