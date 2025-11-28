jest.mock("../src/models/Invitation", () => {
  const ctor = jest.fn(function (data) {
    Object.assign(this, data);
    this.status = this.status || 'pending';
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });
  ctor.findOne = jest.fn();
  ctor.findById = jest.fn();
  ctor.find = jest.fn();
  return ctor;
});

jest.mock("../src/models/Group", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/services/GroupService");
jest.mock("../src/services/UserService");

jest.mock("../src/utils/validator", () => ({
  isNonEmptyString: jest.fn().mockReturnValue(true),
  isValidInvitationAction: jest.fn().mockReturnValue(true),
}));

const Invitation = require("../src/models/Invitation");
const Group = require("../src/models/Group");
const GroupService = require("../src/services/GroupService");
const UserService = require("../src/services/UserService");
const validator = require("../src/utils/validator");
const InvitationService = require("../src/services/InvitationService");

describe("InvitationService", () => {
  let mockGroupService;
  let mockUserService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupService = { addMember: jest.fn() };
    mockUserService = { getUserById: jest.fn().mockResolvedValue({ _id: 'user', isVerified: true }) };
    GroupService.mockImplementation(() => mockGroupService);
    UserService.mockImplementation(() => mockUserService);
  });

  test("sendInvite creates invitation when data is valid", async () => {
    Group.findById.mockResolvedValue({ _id: 'g1', createdBy: 'owner', members: [] });
    Invitation.findOne.mockResolvedValue(null);

    const service = new InvitationService();
    const result = await service.sendInvite('owner', 'guest', 'g1', 'join us');

    expect(validator.isNonEmptyString).toHaveBeenCalled();
    expect(mockUserService.getUserById).toHaveBeenCalledTimes(2);
    expect(Invitation).toHaveBeenCalledWith({
      sender: 'owner',
      recipient: 'guest',
      group: 'g1',
      type: 'invite',
      message: 'join us',
    });
    expect(result.save).toHaveBeenCalled();
  });

  test("sendInvite throws when user already member", async () => {
    Group.findById.mockResolvedValue({
      _id: 'g1',
      createdBy: 'owner',
      members: [{ user: 'guest' }],
    });
    Invitation.findOne.mockResolvedValue(null);

    const service = new InvitationService();
    await expect(service.sendInvite('owner', 'guest', 'g1')).rejects.toThrow('User already in group');
  });

  test("respond accept adds member via groupService", async () => {
    const invitationDoc = {
      _id: 'inv1',
      sender: 'owner',
      recipient: 'guest',
      group: 'g1',
      type: 'invite',
      status: 'pending',
      save: jest.fn().mockResolvedValue(),
    };
    Invitation.findById.mockResolvedValue(invitationDoc);

    const service = new InvitationService();
    const result = await service.respond('inv1', 'accept', 'guest');

    expect(validator.isValidInvitationAction).toHaveBeenCalledWith('accept');
    expect(invitationDoc.status).toBe('accepted');
    expect(invitationDoc.save).toHaveBeenCalled();
    expect(mockGroupService.addMember).toHaveBeenCalledWith('g1', 'guest');
    expect(result).toBe(invitationDoc);
  });
});
