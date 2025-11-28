const cron = require('node-cron')
const Contribution = require('../models/Contribution')
const User = require('../models/User')
const Group = require('../models/Group')

async function sendNotification(user, message) {
  // Placeholder: Replace with actual email, SMS, or push notification logic
  console.log('Notify', user.email, message)
}

function startNotificationJob() {
  cron.schedule('30 8 * * *', async () => {
    let now = new Date()
    let soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    let pending = await Contribution.find({ status: 'pending', dueDate: { $lte: soon } }).populate('member').populate('group')
    for (let i = 0; i < pending.length; i++) {
      let c = pending[i]
      if (c.member && c.group) {
        let msg = `Reminder: You need to pay ${c.amount} for group ${c.group.name} by ${c.dueDate.toDateString()}`
        await sendNotification(c.member, msg)
      }
    }
  })
}

module.exports = { startNotificationJob }
