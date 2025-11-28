jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../src/models/Contribution', () => ({
  find: jest.fn(),
}));

const scheduleMock = require('node-cron').schedule;
const Contribution = require('../src/models/Contribution');
const { startNotificationJob } = require('../src/services/NotificationService');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('schedules reminder job and logs notifications', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const pending = [
      {
        amount: 50,
        dueDate: new Date('2024-05-05'),
        member: { email: 'user@example.com' },
        group: { name: 'Group A' },
      },
    ];

    const populateGroup = jest.fn().mockResolvedValue(pending);
    const populateMember = jest.fn().mockReturnValue({ populate: populateGroup });
    Contribution.find.mockReturnValue({ populate: populateMember });

    startNotificationJob();
    expect(scheduleMock).toHaveBeenCalledWith('30 8 * * *', expect.any(Function));

    const handler = scheduleMock.mock.calls[0][1];
    await handler();

    expect(populateMember).toHaveBeenCalledWith('member');
    expect(populateGroup).toHaveBeenCalledWith('group');
    expect(logSpy).toHaveBeenCalledWith(
      'Notify',
      'user@example.com',
      expect.stringContaining('Reminder: You need to pay 50'),
    );

    logSpy.mockRestore();
  });
});
