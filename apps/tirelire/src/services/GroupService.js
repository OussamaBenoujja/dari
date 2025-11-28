const groupModel = require('../models/Group');
const Contribution = require('../models/Contribution');
const User = require('../models/User');
const UserService = require('./UserService');
const CreditService = require('./CreditService');

class GroupService {
    constructor(){
        this.userService = new UserService();
        this.creditService = new CreditService();
    }

    async createGroup(name, createdBy, contributionAmount, contributionInterval) {
        await this.creditService.assertUserEligibleForGroup(createdBy);
        const creator = await this.userService.getUserById(createdBy);
        if(!creator){
            throw new Error('Creator not found');
        }
        if(!creator.isVerified){
            throw new Error('Creator must be verified');
        }
        const group = new groupModel({
            name,
            createdBy,
            contributionAmount,
            contributionInterval,
            members: [{ user: createdBy }],
            payoutOrder: [createdBy],
        });
        const savedGroup = await group.save();
        await User.findByIdAndUpdate(createdBy, { activeGroup: savedGroup._id });
        return savedGroup;
    }

    async getGroupById(id) {
        return await groupModel.findById(id).populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }
    
    async addMember(groupId, userId) {
        await this.creditService.assertUserEligibleForGroup(userId);
        const group = await groupModel.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        const exists = group.members.some((member) => member && String(member.user) === String(userId));
        if(exists){
            return group.populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
        }

        group.members.push({ user: userId });
        group.markModified('members');
        group.updatedAt = new Date();
        await group.save();
        await User.findByIdAndUpdate(userId, { activeGroup: groupId });

        return await groupModel.findById(groupId).populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }
    async removeMember(groupId, userId) {
        const outstanding = await Contribution.findOne({ group: groupId, member: userId, outstanding: true });
        if(outstanding){
            throw new Error('Member has outstanding contributions and cannot be removed');
        }
        const group = await groupModel.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        group.members = group.members.filter((member) => member && String(member.user) !== String(userId));
        group.payoutOrder = (group.payoutOrder || []).filter((id) => String(id) !== String(userId));
        if(group.nextPayoutIndex >= group.payoutOrder.length){
            group.nextPayoutIndex = 0;
        }
        group.markModified('members');
        group.markModified('payoutOrder');
        group.updatedAt = new Date();
        await group.save();

        const otherGroups = await groupModel.countDocuments({ 'members.user': userId, _id: { $ne: groupId } });
        if(otherGroups === 0){
            await User.findByIdAndUpdate(userId, { activeGroup: null });
        }

        return await groupModel.findById(groupId).populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }
    
    async getAllGroups() {
        return await groupModel.find().populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }

    async updateGroup(id, updateData) {
        return await groupModel.findByIdAndUpdate(id, updateData, { new: true }).populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }


    async deleteGroup(id) {
        return await groupModel.findByIdAndDelete(id);
    }

    async addMessage(groupId, senderId, type, content) {
        const message = { sender: senderId, type, content };
        return await groupModel.findByIdAndUpdate(
            groupId,
            { $push: { messages: message } },
            { new: true }
        ).populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }

    async startNextRound(groupId, startDate){
        return this.creditService.startNextRound(groupId, startDate);
    }

    async closeRound(groupId, roundNumber){
        return this.creditService.closeRoundIfSettled(groupId, roundNumber);
    }

    async getGroupsByUserId(userId) {
        return await groupModel.find({ 'members.user': userId }).populate('createdBy').populate('members.user').populate('payoutOrder').populate('messages.sender');
    }

    async getMessagesByGroupId(groupId) {
        return await groupModel.findById(groupId).populate('messages.sender');
    }

    async getTransactionLogs(groupId) {
        const group = await groupModel.findById(groupId).populate({
            path: 'members.user',
            populate: { path: 'contributions', match: { group: groupId } }
        });
        if (!group) return null;
        const logs = [];
        for (const member of group.members) {
            if (member.user && member.user.contributions) {
                for (const contribution of member.user.contributions) {
                    logs.push({
                        user: member.user._id,
                        amount: contribution.amount,
                        date: contribution.date,
                        group: contribution.group
                    });
                }
            }
        }
        return logs;
    }

}


module.exports = GroupService;