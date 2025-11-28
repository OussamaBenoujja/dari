jest.mock("../src/models/Group", () => {
  const ctor = jest.fn();
  ctor.findById = jest.fn();
  ctor.find = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  ctor.findByIdAndDelete = jest.fn();
  ctor.countDocuments = jest.fn();
  return ctor;
});

jest.mock("../src/models/Contribution", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../src/services/UserService");
jest.mock("../src/services/CreditService");

const Group = require("../src/models/Group");
const Contribution = require("../src/models/Contribution");
const User = require("../src/models/User");
const UserService = require("../src/services/UserService");
const CreditService = require("../src/services/CreditService");
const GroupService = require("../src/services/GroupService");

function buildQuery(doc) {
  return {
    populate: jest.fn().mockReturnThis(),
    then: (resolve) => Promise.resolve(resolve(doc)),
  };
}

describe("GroupService", () => {
  let mockUserService;
  let mockCreditService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserService = {
      getUserById: jest.fn(),
    };
    mockCreditService = {
      assertUserEligibleForGroup: jest.fn(),
      startNextRound: jest.fn(),
      closeRoundIfSettled: jest.fn(),
    };
    UserService.mockImplementation(() => mockUserService);
    CreditService.mockImplementation(() => mockCreditService);
  });

  test("createGroup validates creator and saves group", async () => {
    const saveMock = jest.fn().mockResolvedValue({ _id: "g1" });
    Group.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = saveMock;
      return this;
    });

    mockUserService.getUserById.mockResolvedValue({ _id: "u1", isVerified: true });

    const service = new GroupService();
    const result = await service.createGroup("Team", "u1", 100, "monthly");

    expect(mockCreditService.assertUserEligibleForGroup).toHaveBeenCalledWith("u1");
    expect(mockUserService.getUserById).toHaveBeenCalledWith("u1");
    expect(saveMock).toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("u1", { activeGroup: "g1" });
    expect(result).toEqual({ _id: "g1" });
  });

  test("addMember adds user when not already in group", async () => {
    const groupDoc = {
      _id: "g1",
      members: [{ user: "u1" }],
      markModified: jest.fn(),
      updatedAt: null,
      save: jest.fn().mockResolvedValue(),
    };
    const populatedDoc = { ...groupDoc, members: [{ user: "u1" }, { user: "u2" }] };

    Group.findById
      .mockResolvedValueOnce(groupDoc)
      .mockReturnValueOnce(buildQuery(populatedDoc));

    mockUserService.getUserById.mockResolvedValue({ _id: "u2", isVerified: true });

    const service = new GroupService();
    const result = await service.addMember("g1", "u2");

    expect(mockCreditService.assertUserEligibleForGroup).toHaveBeenCalledWith("u2");
    expect(groupDoc.members).toHaveLength(2);
    expect(groupDoc.save).toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("u2", { activeGroup: "g1" });
    expect(result).toEqual(populatedDoc);
  });

  test("removeMember blocks when outstanding contribution exists", async () => {
    Contribution.findOne.mockResolvedValue({ _id: "c1" });
    const service = new GroupService();
    await expect(service.removeMember("g1", "u2")).rejects.toThrow('Member has outstanding contributions and cannot be removed');
  });

  test("removeMember updates group and clears activeGroup", async () => {
    Contribution.findOne.mockResolvedValue(null);
    const groupDoc = {
      _id: "g1",
      members: [{ user: "u1" }, { user: "u2" }],
      payoutOrder: ["u1", "u2"],
      nextPayoutIndex: 1,
      markModified: jest.fn(),
      updatedAt: null,
      save: jest.fn().mockResolvedValue(),
    };
    const populatedDoc = { ...groupDoc, members: [{ user: "u1" }] };

    Group.findById
      .mockResolvedValueOnce(groupDoc)
      .mockReturnValueOnce(buildQuery(populatedDoc));

    Group.countDocuments.mockResolvedValue(0);

    const service = new GroupService();
    const result = await service.removeMember("g1", "u2");

    expect(groupDoc.members).toEqual([{ user: "u1" }]);
    expect(groupDoc.nextPayoutIndex).toBe(0);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("u2", { activeGroup: null });
    expect(result).toEqual(populatedDoc);
  });
});
