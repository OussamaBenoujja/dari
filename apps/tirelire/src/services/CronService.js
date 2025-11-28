const cron = require('node-cron');
const Group = require('../models/Group');
const Contribution = require('../models/Contribution');
const CreditService = require('./CreditService');
const PaymentService = require('./PaymentService');

const creditService = new CreditService();
const paymentService = new PaymentService();


const User = require('../models/User');

function startCronJobs() {
  cron.schedule('0 * * * *', async () => {
    const groups = await Group.find();
    for (const group of groups) {
      const roundNumber = group.currentRound - 1;
      const contributions = await Contribution.find({ group: group._id, round: roundNumber });
      if (contributions.length === 0) continue;
      const allPaid = contributions.every(c => c.status === 'paid');
      if (allPaid) {
        const entry = group.roundHistory.find(r => r.roundNumber === roundNumber);
        if (entry && entry.status !== 'complete') {
          entry.status = 'complete';
          entry.closedAt = new Date();
          group.markModified('roundHistory');
          group.updatedAt = new Date();
          await group.save();

          const beneficiaryId = entry.beneficiary;
          const beneficiary = await User.findById(beneficiaryId);
          if (beneficiary && beneficiary.stripeAccountId) {
            const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
            try {
              await paymentService.stripe.transfers.create({
                amount: Math.round(totalAmount * 100),
                currency: 'usd',
                destination: beneficiary.stripeAccountId
              });
            } catch (err) {}
          }
        }
      }
    }
    await creditService.applyPenalties();
  });
}

module.exports = { startCronJobs };