const Contribution = require('../models/Contribution');
const CreditService = require('../services/CreditService');

const creditService = new CreditService();

async function listByGroup(req, res){
	try {
		const contributions = await Contribution.find({ group: req.params.groupId }).populate('member').populate('group');
		return res.status(200).json(contributions);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function payContribution(req, res){
	try {
		const payment = await creditService.recordContributionPayment(req.params.contributionId, new Date());
		return res.status(200).json(payment);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = {
	listByGroup,
	payContribution
};
