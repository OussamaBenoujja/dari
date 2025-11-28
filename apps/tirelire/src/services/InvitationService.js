const Invitation = require('../models/Invitation');
const Group = require('../models/Group');
const GroupService = require('./GroupService');
const UserService = require('./UserService');
const validator = require('../utils/validator');

class InvitationService {
    constructor(){
        this.groupService = new GroupService();
        this.userService = new UserService();
    }

    async sendInvite(senderId, recipientId, groupId, message){
        await this.checkBasicData(senderId, recipientId, groupId);
        const group = await Group.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        if(String(group.createdBy) !== String(senderId)){
            throw new Error('Only group owner can send invites');
        }
        if(this.userIsMember(group, recipientId)){
            throw new Error('User already in group');
        }
        const exists = await Invitation.findOne({ sender: senderId, recipient: recipientId, group: groupId, status: 'pending' });
        if(exists){
            return exists;
        }
        const invitation = new Invitation({
            sender: senderId,
            recipient: recipientId,
            group: groupId,
            type: 'invite',
            message: message
        });
        return invitation.save();
    }

    async sendJoinRequest(senderId, groupId, message){
        const group = await Group.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        if(this.userIsMember(group, senderId)){
            throw new Error('User already in group');
        }
        const recipientId = group.createdBy;
        await this.checkBasicData(senderId, recipientId, groupId);
        const exists = await Invitation.findOne({ sender: senderId, recipient: recipientId, group: groupId, type: 'request', status: 'pending' });
        if(exists){
            return exists;
        }
        const invitation = new Invitation({
            sender: senderId,
            recipient: recipientId,
            group: groupId,
            type: 'request',
            message: message
        });
        return invitation.save();
    }

    async respond(invitationId, action, actorId){
        const invitation = await Invitation.findById(invitationId);
        if(!invitation){
            throw new Error('Invitation not found');
        }
        if(invitation.status !== 'pending'){
            throw new Error('Invitation already handled');
        }
        if(!validator.isValidInvitationAction(action)){
            throw new Error('Action is not allowed');
        }
        const actionLower = action.toLowerCase();
        if(actionLower === 'cancel'){
            if(String(invitation.sender) !== String(actorId)){
                throw new Error('Only sender can cancel');
            }
            invitation.status = 'canceled';
            await invitation.save();
            return invitation;
        }
        if(actionLower === 'accept'){
            const canAccept = this.canRespond(invitation, actorId, true);
            if(!canAccept){
                throw new Error('User cannot accept this invitation');
            }
            invitation.status = 'accepted';
            await invitation.save();
            await this.addMemberAfterAccept(invitation);
            return invitation;
        }
        if(actionLower === 'decline'){
            const canDecline = this.canRespond(invitation, actorId, false);
            if(!canDecline){
                throw new Error('User cannot decline this invitation');
            }
            invitation.status = 'declined';
            await invitation.save();
            return invitation;
        }
        throw new Error('Unknown action');
    }

    async listPendingForUser(userId){
        return Invitation.find({ recipient: userId, status: 'pending' }).populate('group').populate('sender');
    }

    async listPendingForGroup(groupId){
        return Invitation.find({ group: groupId, status: 'pending' }).populate('recipient').populate('sender');
    }

    async checkBasicData(senderId, recipientId, groupId){
        if(!validator.isNonEmptyString(String(senderId))){
            throw new Error('Sender is required');
        }
        if(!validator.isNonEmptyString(String(recipientId))){
            throw new Error('Recipient is required');
        }
        if(!validator.isNonEmptyString(String(groupId))){
            throw new Error('Group is required');
        }
        const sender = await this.userService.getUserById(senderId);
        if(!sender){
            throw new Error('Sender not found');
        }
        if(!sender.isVerified){
            throw new Error('Sender must be verified');
        }
        const recipient = await this.userService.getUserById(recipientId);
        if(!recipient){
            throw new Error('Recipient not found');
        }
    }

    userIsMember(group, userId){
        if(!group || !group.members){
            return false;
        }
        for(const member of group.members){
            if(member && String(member.user) === String(userId)){
                return true;
            }
        }
        return false;
    }

    canRespond(invitation, actorId, isAccept){
        const actor = String(actorId);
        if(invitation.type === 'invite'){
            return actor === String(invitation.recipient);
        }
        if(invitation.type === 'request'){
            if(isAccept){
                return actor === String(invitation.recipient);
            }
            return actor === String(invitation.recipient) || actor === String(invitation.sender);
        }
        return false;
    }

    async addMemberAfterAccept(invitation){
        const groupId = invitation.group;
        if(invitation.type === 'invite'){
            await this.groupService.addMember(groupId, invitation.recipient);
        } else if(invitation.type === 'request'){
            await this.groupService.addMember(groupId, invitation.sender);
        }
    }
}

module.exports = InvitationService;
