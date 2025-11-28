jest.mock("../src/models/Group", () => {
  const ctor = jest.fn();
  ctor.findById = jest.fn();
  ctor.find = jest.fn();
  ctor.countDocuments = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  return ctor;
});

jest.mock("../src/models/Contribution", () => {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    insertMany: jest.fn(),
  };
});

jest.mock("../src/models/User", () => ({
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
}));

const Group = require("../src/models/Group");
const Contribution = require("../src/models/Contribution");
const User = require("../src/models/User");
const CreditService = require("../src/services/CreditService");

describe("CreditService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildGroup(overrides = {}) {
    const group = {
      _id: "g1",
      members: [
        { user: "u1", isActive: true, isBanned: false, reliabilityScore: 50, joinDate: "2024-01-01", totalPaid: 0, missedRounds: 0, penalties: 0 },
        { user: "u2", isActive: true, isBanned: false, reliabilityScore: 60, joinDate: "2024-02-01", totalPaid: 10, missedRounds: 2, penalties: 1 },
      ],
      payoutOrder: [],
      nextPayoutIndex: 0,
      currentRound: 1,
      roundHistory: [],
      contributionInterval: "monthly",
      contributionAmount: 100,
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(),
      updatedAt: null,
      ...overrides,
    };
    return group;
  }

  test("startNextRound assigns beneficiary and creates contributions", async () => {
    const groupDoc = buildGroup();
    Group.findById.mockResolvedValue(groupDoc);

    const leanFn = jest.fn().mockResolvedValue([]);
    Contribution.find.mockReturnValue({ lean: leanFn });
    Contribution.insertMany.mockResolvedValue([]);

    const service = new CreditService({ penaltyPoints: 5, rewardPoints: 3 });
    const result = await service.startNextRound("g1", new Date("2024-03-01"));

    expect(Group.findById).toHaveBeenCalledWith("g1");
    expect(groupDoc.roundHistory).toHaveLength(1);
    expect(groupDoc.roundHistory[0].beneficiary).toBe("u2");
    expect(Contribution.insertMany).toHaveBeenCalledTimes(1);
    const docs = Contribution.insertMany.mock.calls[0][0];
    expect(docs).toHaveLength(2);
    expect(groupDoc.save).toHaveBeenCalled();
    expect(result.beneficiary).toBe("u2");
    expect(result.roundNumber).toBe(1);
  });

  test("recordContributionPayment updates contribution and member stats", async () => {
    const contributionDoc = {
      _id: "c1",
      group: "g1",
      member: "u1",
      amount: 100,
      round: 1,
      status: "pending",
      outstanding: true,
      save: jest.fn().mockResolvedValue(),
    };
    Contribution.findById.mockResolvedValue(contributionDoc);

    const groupDoc = buildGroup({
      members: [
        { user: "u1", isActive: true, isBanned: false, reliabilityScore: 40, totalPaid: 0, missedRounds: 1, penalties: 0 },
      ],
    });
    Group.findById.mockResolvedValue(groupDoc);

    const updatedUser = { outstandingContributionCount: 1, save: jest.fn().mockResolvedValue() };
    User.findByIdAndUpdate.mockResolvedValue(updatedUser);

    const service = new CreditService({ rewardPoints: 4 });
    const result = await service.recordContributionPayment("c1", new Date("2024-03-10"));

    expect(contributionDoc.status).toBe("paid");
    expect(groupDoc.members[0].reliabilityScore).toBe(44);
    expect(groupDoc.members[0].missedRounds).toBe(0);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("u1", { $inc: { outstandingContributionCount: -1 } }, { new: true });
    expect(result).toBe(contributionDoc);
  });

  test("applyPenalties marks overdue contributions and penalizes members", async () => {
    const overdueContribution = {
      _id: "contrib1",
      group: "g1",
      member: "u1",
      amount: 100,
      status: "pending",
      penaltyApplied: false,
      penaltyCount: 0,
      outstanding: false,
      save: jest.fn().mockResolvedValue(),
    };

    Contribution.find.mockResolvedValue([overdueContribution]);

    const groupDoc = buildGroup({
      members: [
        { user: "u1", isActive: true, isBanned: false, reliabilityScore: 20, missedRounds: 1, penalties: 0 },
      ],
    });
    Group.findById.mockResolvedValue(groupDoc);

    User.findByIdAndUpdate.mockResolvedValue({});

    const service = new CreditService({ gracePeriodDays: 0, penaltyPoints: 15 });
    const results = await service.applyPenalties(new Date("2024-05-01"));

    expect(results).toHaveLength(1);
    expect(overdueContribution.status).toBe("missed");
    expect(groupDoc.members[0].penalties).toBe(1);
    expect(groupDoc.members[0].reliabilityScore).toBe(5);
    expect(groupDoc.save).toHaveBeenCalled();
  });
});
