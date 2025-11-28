const contributionModel = require('../models/Contribution');
const groupModel = require('../models/Group');
const Stripe = require('stripe');
const CreditService = require('./CreditService');

class PaymentService {
    constructor(){
        const secretKey = process.env.STRIPE_SECRET_KEY;
        this.stripe = secretKey ? Stripe(secretKey) : null;
        this.creditService = new CreditService();
    }

    async createPaymentIntent(amount, currency, contributionId){
        if(!this.stripe){
            throw new Error('Stripe integration not configured');
        }
        const params = {
            amount: amount,
            currency: currency
        };
        const paymentIntent = await this.stripe.paymentIntents.create(params);
        if(contributionId){
            await contributionModel.findByIdAndUpdate(contributionId, { stripePaymentIntentId: paymentIntent.id }, { new: true });
        }
        return paymentIntent;
    }

    async verifyContributionPayment(contributionId){
    if(!this.stripe){
            throw new Error('Stripe integration not configured');
        }
    let contribution = await contributionModel.findById(contributionId);
        if(!contribution){
            throw new Error('Contribution not found');
        }
        const paymentIntentId = contribution.stripePaymentIntentId;
        if(!paymentIntentId){
            throw new Error('Contribution has no Stripe payment intent');
        }
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        if(paymentIntent && paymentIntent.status === 'succeeded'){
            await this.creditService.recordContributionPayment(contributionId, new Date());
            contribution = await contributionModel.findById(contributionId);
        }
        const result = {
            contribution: contribution,
            paymentIntent: paymentIntent
        };
        return result;
    }

    async recordContribution(groupId, memberId, amount, round, dueDate) {
        const group = await groupModel.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        const scheduleDate = dueDate || this.creditService.calculateDueDate(new Date(), group.contributionInterval);
        const contributionData = {
            group: groupId,
            member: memberId,
            amount: amount,
            round: round,
            status: 'pending',
            dueDate: scheduleDate
        };
        const contribution = new contributionModel(contributionData);
        return await contribution.save();
    }

    async getContributionsByGroup(groupId) {
        return await contributionModel.find({ group: groupId }).populate('member').populate('group');
    }

    async getContributionsByMember(memberId) {
        return await contributionModel.find({ member: memberId }).populate('member').populate('group');
    }

    async updateContributionStatus(contributionId, status) {
        return await contributionModel.findByIdAndUpdate(contributionId, { status: status }, { new: true }).populate('member').populate('group');
    }

    async getAllContributions() {
        return await contributionModel.find().populate('member').populate('group');
    }

    async deleteContribution(contributionId) {
        return await contributionModel.findByIdAndDelete(contributionId);
    }
}

module.exports = PaymentService;