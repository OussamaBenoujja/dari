async function sendGroupMessage(req, res) {
	try {
		const user = req.authUser;
		if (!user) return res.status(401).json({ message: 'Not authenticated' });
		const group = await groupService.getGroupById(req.params.groupId);
		if (!group) return res.status(404).json({ message: 'Group not found' });
		const { content, type } = req.body || {};
		if (!content) return res.status(400).json({ message: 'Message content required' });
		const msg = {
			sender: user._id,
			type: type || 'text',
			content,
			date: new Date()
		};
		group.messages.push(msg);
		group.markModified('messages');
		await group.save();
		return res.status(201).json(msg);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function listGroupMessages(req, res) {
	try {
		const group = await groupService.getGroupById(req.params.groupId);
		if (!group) return res.status(404).json({ message: 'Group not found' });
		return res.status(200).json(group.messages || []);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}
const GroupService = require('../services/GroupService');
const CreditService = require('../services/CreditService');

const groupService = new GroupService();
const creditService = new CreditService();

async function listGroups(req, res){
	try {
		const groups = await groupService.getAllGroups();
		return res.status(200).json(groups);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getGroup(req, res){
	try {
		const group = await groupService.getGroupById(req.params.groupId);
		if(!group){
			return res.status(404).json({ message: 'Group not found' });
		}
		return res.status(200).json(group);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function createGroup(req, res){
	try {
		const user = req.authUser;
		if(!user){
			return res.status(401).json({ message: 'Only verified users can create groups' });
		}
		const { name, contributionAmount, contributionInterval } = req.body || {};
		const created = await groupService.createGroup(name, user._id, contributionAmount, contributionInterval || 'monthly');
		return res.status(201).json(created);
	} catch (err) {
		const status = err.message && err.message.includes('verified') ? 403 : 400;
		return res.status(status).json({ message: err.message });
	}
}

async function joinGroup(req, res){
	try {
		const user = req.authUser;
		if(!user){
			return res.status(401).json({ message: 'Only verified users can join groups' });
		}
		const updated = await groupService.addMember(req.params.groupId, user._id);
		return res.status(200).json(updated);
	} catch (err) {
		const status = err.message && err.message.includes('outstanding') ? 403 : 400;
		return res.status(status).json({ message: err.message });
	}
}

async function removeMember(req, res){
	try {
		const requester = req.authUser;
		const memberId = req.params.memberId;
		if(!requester){
			return res.status(401).json({ message: 'Only verified users can remove members' });
		}
		const group = await groupService.getGroupById(req.params.groupId);
		if(!group){
			return res.status(404).json({ message: 'Group not found' });
		}
		const isOwner = String(group.createdBy._id || group.createdBy) === String(requester._id);
		const isSelf = String(requester._id) === String(memberId);
		if(!isOwner && !isSelf){
			return res.status(403).json({ message: 'Only the owner or the member can leave' });
		}
		const updated = await groupService.removeMember(req.params.groupId, memberId);
		return res.status(200).json(updated);
	} catch (err) {
		const status = err.message && err.message.includes('outstanding') ? 403 : 400;
		return res.status(status).json({ message: err.message });
	}
}

async function startRound(req, res){
	try {
		const requester = req.authUser;
		if(!requester){
			return res.status(401).json({ message: 'Only verified users can start rounds' });
		}
		const group = await groupService.getGroupById(req.params.groupId);
		if(!group){
			return res.status(404).json({ message: 'Group not found' });
		}
		const isOwner = String(group.createdBy._id || group.createdBy) === String(requester._id);
		if(!isOwner){
			return res.status(403).json({ message: 'Only the creator can start rounds' });
		}
		const result = await groupService.startNextRound(req.params.groupId, new Date());
		return res.status(200).json(result);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function getRoundHistory(req, res){
	try {
		const group = await groupService.getGroupById(req.params.groupId);
		if(!group){
			return res.status(404).json({ message: 'Group not found' });
		}
		return res.status(200).json(group.roundHistory || []);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function applyPenalties(req, res){
	try {
		const requester = req.authUser;
		if(!requester || requester.role !== 'admin'){
			return res.status(403).json({ message: 'Only admins can apply penalties' });
		}
		const updated = await creditService.applyPenalties(new Date());
		return res.status(200).json({ count: updated.length });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = {
	listGroups,
	getGroup,
	createGroup,
	joinGroup,
	removeMember,
	startRound,
	getRoundHistory,
	applyPenalties
	,sendGroupMessage
	,listGroupMessages
};
