const Group = require('../models/Group');
const Contribution = require('../models/Contribution');
const User = require('../models/User');

const INTERVAL_IN_DAYS = {
    weekly: 7,
    monthly: 30
};

function addDays(baseDate, days){
    const date = new Date(baseDate.getTime());
    date.setDate(date.getDate() + days);
    return date;
}

class CreditService {
    constructor(options){
        options = options || {};
        this.gracePeriodDays = options.gracePeriodDays || 3;
        this.penaltyPoints = options.penaltyPoints || 10;
        this.rewardPoints = options.rewardPoints || 2;
    }

    async startNextRound(groupId, startDate){
        const referenceDate = startDate || new Date();
        const group = await Group.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        const eligibleMembers = group.members.filter((member) => member && member.isActive && !member.isBanned);
        if(eligibleMembers.length === 0){
            throw new Error('No eligible members for payout');
        }

        if(!group.payoutOrder || group.payoutOrder.length === 0){
            group.payoutOrder = this.buildInitialPayoutOrder(eligibleMembers);
            group.nextPayoutIndex = 0;
        } else {
            group.payoutOrder = group.payoutOrder.filter((memberId) => eligibleMembers.some((m) => m.user && String(m.user) === String(memberId)));
            const existingIds = group.payoutOrder.map((id) => String(id));
            const newMemberIds = eligibleMembers
                .map((m) => m.user)
                .filter((id) => !existingIds.includes(String(id)));
            if(newMemberIds.length > 0){
                group.payoutOrder = group.payoutOrder.concat(newMemberIds);
            }
            if(group.payoutOrder.length === 0){
                group.payoutOrder = this.buildInitialPayoutOrder(eligibleMembers);
                group.nextPayoutIndex = 0;
            }
        }

        const payoutIndex = group.nextPayoutIndex % group.payoutOrder.length;
        const beneficiary = group.payoutOrder[payoutIndex];
        const roundNumber = group.currentRound;
        const dueDate = this.calculateDueDate(referenceDate, group.contributionInterval);

        this.ensureRoundHistory(group, roundNumber, beneficiary, referenceDate, dueDate);
        await this.ensureRoundContributions(group, roundNumber, dueDate);

        group.nextPayoutIndex = (payoutIndex + 1) % group.payoutOrder.length;
        group.currentRound = roundNumber + 1;
        group.updatedAt = new Date();
        await group.save();

        return {
            roundNumber,
            beneficiary,
            dueDate
        };
    }

    buildInitialPayoutOrder(members){
        return members
            .slice()
            .sort((a, b) => {
                if(a.reliabilityScore === b.reliabilityScore){
                    return new Date(a.joinDate) - new Date(b.joinDate);
                }
                return b.reliabilityScore - a.reliabilityScore;
            })
            .map((member) => member.user);
    }

    ensureRoundHistory(group, roundNumber, beneficiary, startedAt, dueDate){
        const existing = group.roundHistory.find((entry) => entry.roundNumber === roundNumber);
        if(existing){
            existing.beneficiary = beneficiary;
            existing.startedAt = startedAt;
            existing.dueDate = dueDate;
            existing.status = 'active';
        } else {
            group.roundHistory.push({
                roundNumber,
                beneficiary,
                startedAt,
                dueDate,
                status: 'active'
            });
        }
        group.markModified('roundHistory');
    }

    async ensureRoundContributions(group, roundNumber, dueDate){
        const memberIds = group.members.filter((m) => m && m.isActive && !m.isBanned).map((m) => m.user);
        if(memberIds.length === 0){
            return;
        }
        const existingContributions = await Contribution.find({
            group: group._id,
            round: roundNumber
        }).lean();
        const existingMap = new Map();
        for(const contribution of existingContributions){
            existingMap.set(String(contribution.member), contribution);
        }
        const docs = [];
        for(const memberId of memberIds){
            if(existingMap.has(String(memberId))){
                continue;
            }
            docs.push({
                group: group._id,
                member: memberId,
                amount: group.contributionAmount,
                round: roundNumber,
                dueDate: dueDate,
                status: 'pending'
            });
        }
        if(docs.length > 0){
            await Contribution.insertMany(docs, { ordered: false });
        }
    }

    async recordContributionPayment(contributionId, paymentDate){
        const contribution = await Contribution.findById(contributionId);
        if(!contribution){
            throw new Error('Contribution not found');
        }
        if(contribution.status === 'paid'){
            return contribution;
        }
        const wasOutstanding = contribution.outstanding;
        contribution.status = 'paid';
        contribution.paidAt = paymentDate || new Date();
        contribution.outstanding = false;
        await contribution.save();

        const group = await Group.findById(contribution.group);
        if(group){
            const member = group.members.find((m) => m && String(m.user) === String(contribution.member));
            if(member){
                member.lastContributionRound = contribution.round;
                member.totalPaid += contribution.amount;
                member.reliabilityScore = Math.min(100, member.reliabilityScore + this.rewardPoints);
                member.missedRounds = 0;
                group.markModified('members');
                group.updatedAt = new Date();
                await group.save();
            }
        }

        if(wasOutstanding){
            const updatedUser = await User.findByIdAndUpdate(
                contribution.member,
                { $inc: { outstandingContributionCount: -1 } },
                { new: true }
            );
            if(updatedUser && updatedUser.outstandingContributionCount < 0){
                updatedUser.outstandingContributionCount = 0;
                await updatedUser.save();
            }
        }

        return contribution;
    }

    async applyPenalties(referenceDate){
        const today = referenceDate || new Date();
        const graceDeadline = addDays(today, -this.gracePeriodDays);
        const overdue = await Contribution.find({
            status: 'pending',
            dueDate: { $lt: graceDeadline }
        });

        if(overdue.length === 0){
            return [];
        }

        const groupsCache = new Map();
        const groupMutations = new Set();
        const updates = [];

        for(const contribution of overdue){
            contribution.status = 'missed';
            contribution.penaltyApplied = true;
            contribution.penaltyCount += 1;
            contribution.outstanding = true;
            updates.push(contribution.save());

            let group = groupsCache.get(String(contribution.group));
            if(!group){
                group = await Group.findById(contribution.group);
                if(group){
                    groupsCache.set(String(contribution.group), group);
                }
            }
            if(group){
                const member = group.members.find((m) => m && String(m.user) === String(contribution.member));
                if(member){
                    member.penalties += 1;
                    member.missedRounds += 1;
                    member.reliabilityScore = Math.max(0, member.reliabilityScore - this.penaltyPoints);
                    if(member.missedRounds >= 3){
                        member.isBanned = true;
                        member.isActive = false;
                    }
                    group.markModified('members');
                    group.updatedAt = new Date();
                    groupMutations.add(group);
                }
            }

            updates.push(User.findByIdAndUpdate(contribution.member, {
                $inc: { outstandingContributionCount: 1 }
            }));
        }

        for(const group of groupMutations){
            updates.push(group.save());
        }

        await Promise.all(updates);
        return overdue;
    }

    async closeRoundIfSettled(groupId, roundNumber){
        const contributions = await Contribution.find({ group: groupId, round: roundNumber });
        if(contributions.length === 0){
            return null;
        }
        const hasPending = contributions.some((item) => item.status === 'pending');
        const hasMissed = contributions.some((item) => item.status === 'missed');
        const group = await Group.findById(groupId);
        if(!group){
            throw new Error('Group not found');
        }
        const entry = group.roundHistory.find((r) => r.roundNumber === roundNumber);
        if(!entry){
            return null;
        }
        if(hasPending){
            entry.status = 'active';
        } else if(hasMissed){
            entry.status = 'defaulted';
        } else {
            entry.status = 'complete';
        }
        entry.closedAt = new Date();
        group.markModified('roundHistory');
        group.updatedAt = new Date();
        await group.save();
        return entry;
    }

    async assertUserEligibleForGroup(userId){
        const user = await User.findById(userId);
        if(!user){
            throw new Error('User not found');
        }
        if(user.activeGroup){
            throw new Error('User is already participating in another active group');
        }
        if(user.outstandingContributionCount > 0){
            throw new Error('User has outstanding contributions that must be cleared before joining');
        }
        return user;
    }

    calculateDueDate(startDate, interval){
        const duration = INTERVAL_IN_DAYS[interval] || INTERVAL_IN_DAYS.monthly;
        return addDays(startDate, duration);
    }
}

module.exports = CreditService;
