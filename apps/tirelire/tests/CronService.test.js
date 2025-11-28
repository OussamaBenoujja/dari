jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

const scheduleMock = require('node-cron').schedule;

const mockPaymentService = {
  stripe: {
    transfers: { create: jest.fn().mockResolvedValue({}) },
  },
};
const mockCreditService = {
  applyPenalties: jest.fn().mockResolvedValue([]),
};

jest.mock('../src/services/PaymentService', () => jest.fn(() => mockPaymentService));
jest.mock('../src/services/CreditService', () => jest.fn(() => mockCreditService));

jest.mock('../src/models/Group', () => ({
  find: jest.fn(),
}));

jest.mock('../src/models/Contribution', () => ({
  find: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
  findById: jest.fn(),
}));

const Group = require('../src/models/Group');
const Contribution = require('../src/models/Contribution');
const User = require('../src/models/User');
const { startCronJobs } = require('../src/services/CronService');

describe('CronService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('schedules hourly job and settles completed rounds', async () => {
    startCronJobs();
    expect(scheduleMock).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
    const handler = scheduleMock.mock.calls[0][1];

    const groupDoc = {
      _id: 'g1',
      currentRound: 2,
      roundHistory: [{ roundNumber: 1, status: 'active', beneficiary: 'u1' }],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(),
      updatedAt: null,
    };
    Group.find.mockResolvedValue([groupDoc]);

    const contributions = [
      { amount: 100, status: 'paid' },
      { amount: 120, status: 'paid' },
    ];
    Contribution.find.mockResolvedValue(contributions);

    User.findById.mockResolvedValue({ stripeAccountId: 'acct_1' });

    await handler();

    expect(groupDoc.roundHistory[0].status).toBe('complete');
    expect(mockPaymentService.stripe.transfers.create).toHaveBeenCalledWith({
      amount: 22000,
      currency: 'usd',
      destination: 'acct_1',
    });
    expect(mockCreditService.applyPenalties).toHaveBeenCalled();
  });
});
