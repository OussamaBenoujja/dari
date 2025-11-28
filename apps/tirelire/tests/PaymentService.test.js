const contributionModel = require("../src/models/Contribution");
const groupModel = require("../src/models/Group");
const Stripe = require("stripe");
const CreditService = require("../src/services/CreditService");
const PaymentService = require("../src/services/PaymentService");

jest.mock("../src/models/Contribution");
jest.mock("../src/models/Group");
jest.mock("stripe");
jest.mock("../src/services/CreditService");

describe("PaymentService", () => {
  let paymentService;
  let mockStripeInstance;
  let mockCreditService;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "fake_key";

    mockStripeInstance = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    };

    Stripe.mockReturnValue(mockStripeInstance);

    mockCreditService = {
      recordContributionPayment: jest.fn(),
      calculateDueDate: jest.fn(),
    };

    CreditService.mockImplementation(() => mockCreditService);

    paymentService = new PaymentService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create a payment intent and update contribution", async () => {
    const mockIntent = { id: "pi_123", status: "requires_payment_method" };
    mockStripeInstance.paymentIntents.create.mockResolvedValue(mockIntent);
    contributionModel.findByIdAndUpdate.mockResolvedValue({});

    const result = await paymentService.createPaymentIntent(
      1000,
      "usd",
      "c123",
    );

    expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1000,
      currency: "usd",
    });
    expect(contributionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "c123",
      { stripePaymentIntentId: "pi_123" },
      { new: true },
    );
    expect(result).toEqual(mockIntent);
  });

  test("should verify successful contribution payment", async () => {
    const mockContribution = { _id: "c1", stripePaymentIntentId: "pi_123" };
    const mockPaymentIntent = { id: "pi_123", status: "succeeded" };

    contributionModel.findById.mockResolvedValue(mockContribution);
    mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(
      mockPaymentIntent,
    );
    mockCreditService.recordContributionPayment.mockResolvedValue();

    const result = await paymentService.verifyContributionPayment("c1");

    expect(contributionModel.findById).toHaveBeenCalledWith("c1");
    expect(mockCreditService.recordContributionPayment).toHaveBeenCalledWith(
      "c1",
      expect.any(Date),
    );
    expect(result.paymentIntent.status).toBe("succeeded");
  });

  test("should record contribution for a group", async () => {
    const mockGroup = { _id: "g1", contributionInterval: "monthly" };
    const mockContribution = {
      save: jest.fn().mockResolvedValue({ id: "saved" }),
    };

    groupModel.findById.mockResolvedValue(mockGroup);
    mockCreditService.calculateDueDate.mockReturnValue(new Date());
    contributionModel.mockImplementation(() => mockContribution);

    const result = await paymentService.recordContribution("g1", "m1", 200, 1);

    expect(groupModel.findById).toHaveBeenCalledWith("g1");
    expect(mockContribution.save).toHaveBeenCalled();
    expect(result).toEqual({ id: "saved" });
  });
});
