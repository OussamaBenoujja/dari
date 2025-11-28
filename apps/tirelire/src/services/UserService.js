const User = require('../models/User');


class UserService {

    constructor(){
        this.verificationService = null;
    }

    async createUser(first_Name, last_Name, email, adress, password, role){
        const userData = {
            first_Name: first_Name,
            last_Name: last_Name,
            email: email,
            adress: adress,
            password: password,
            role: role
        };
        const user = new User(userData);
        return user.save();
    }

    async getUserByEmail(email, options){
        options = options || {};
        const includePassword = options.includePassword === true;
        return User.findByEmail(email, includePassword);
    }

    async getUserById(id){
        return User.findById(id);
    }

    async updateUser(id, updateData){
        return User.findByIdAndUpdate(id, updateData, {new: true});
    }

    async deleteUser(id){
        return User.findByIdAndDelete(id);
    }

    async verifyPassword(email, password){
        const user = await this.getUserByEmail(email, { includePassword: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user.comparePassword(password);
    }

    async getAllUsers(){
        return User.find();
    }

    async login(email, password){
        const user = await this.getUserByEmail(email, { includePassword: true });
        if(!user){
            throw new Error('User not found');
        }
        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid){
            throw new Error('Invalid password');
        }
        const data = user.toObject();
        delete data.password;
        return data;
    }

    async register(first_Name, last_Name, email, adress, password, role){
        return this.createUser(first_Name, last_Name, email, adress, password, role);
    }

    verifyID(id, verification_type, verification_id, verify_card_Image, verificationSelfie){
        const update = {
            verification_type: verification_type,
            verification_id: verification_id,
            verify_card_Image: verify_card_Image,
            isVerified: true
        };
        if(verificationSelfie){
            update.verificationSelfie = verificationSelfie;
        }
        return this.updateUser(id, update);
    }

    async submitVerificationRequest(userId, payload){
        const service = this.getVerificationService();
        return service.submitVerification(userId, payload);
    }

    async manualVerificationDecision(requestId, reviewerId, decision, notes){
        const service = this.getVerificationService();
        return service.manualReview(requestId, reviewerId, decision, notes);
    }

    getVerificationService(){
        if(!this.verificationService){
            const VerificationService = require('./VerificationService');
            this.verificationService = new VerificationService();
        }
        return this.verificationService;
    }
}



module.exports = UserService;