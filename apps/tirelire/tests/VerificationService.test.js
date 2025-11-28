jest.mock("fs", () => ({
  access: jest.fn((_, __, cb) => cb(null)),
}));

jest.mock("canvas", () => ({
  Canvas: function () {},
  Image: function () {},
  ImageData: function () {},
  loadImage: jest.fn().mockResolvedValue({}),
}));

jest.mock("@tensorflow/tfjs-node", () => ({}));

jest.mock("@vladmandic/face-api", () => {
  const detectSingleFace = jest.fn();
  const euclideanDistance = jest.fn().mockReturnValue(0.3);
  return {
    env: { monkeyPatch: jest.fn() },
    tf: {
      setBackend: jest.fn(),
      enableProdMode: jest.fn(),
      ready: jest.fn().mockResolvedValue(),
    },
    nets: {
      ssdMobilenetv1: { loadFromDisk: jest.fn().mockResolvedValue() },
      faceLandmark68Net: { loadFromDisk: jest.fn().mockResolvedValue() },
      faceRecognitionNet: { loadFromDisk: jest.fn().mockResolvedValue() },
    },
    detectSingleFace,
    euclideanDistance,
  };
});

jest.mock("../src/models/VerificationRequest", () => {
  const ctor = jest.fn(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });
  ctor.findById = jest.fn();
  ctor.findOne = jest.fn();
  ctor.find = jest.fn();
  return ctor;
});

jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/utils/validator", () => ({
  validateVerificationInputs: jest.fn().mockReturnValue({}),
}));

const validator = require("../src/utils/validator");
const VerificationRequest = require("../src/models/VerificationRequest");
const User = require("../src/models/User");
const VerificationService = require("../src/services/VerificationService");

describe("VerificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("submitVerification throws when validation fails", async () => {
    validator.validateVerificationInputs.mockReturnValue({ idNumber: "required" });
    const service = new VerificationService();

    await expect(service.submitVerification("u1", {})).rejects.toThrow("Validation failed");
  });

  test("submitVerification auto-approves and marks user verified", async () => {
    validator.validateVerificationInputs.mockReturnValue({});
    const userDoc = {
      _id: "u1",
      isVerified: false,
      save: jest.fn().mockResolvedValue(),
    };
    User.findById.mockResolvedValue(userDoc);

    const requestInstance = {
      user: "u1",
      status: "pending",
      autoMatched: false,
      autoScore: null,
      reason: null,
      save: jest.fn().mockResolvedValue(),
    };
    VerificationRequest.mockImplementationOnce(() => requestInstance);

    const spy = jest
      .spyOn(VerificationService.prototype, "tryAutomaticVerification")
      .mockResolvedValue({ processed: true, matched: true, score: 0.2 });

    const service = new VerificationService();
    const result = await service.submitVerification("u1", {
      verificationType: "id",
      idNumber: "123",
      idDocumentPath: "file.png",
      selfiePath: "selfie.png",
    });

    expect(spy).toHaveBeenCalled();
    expect(userDoc.isVerified).toBe(true);
    expect(result.status).toBe("auto_approved");
    expect(requestInstance.autoMatched).toBe(true);
    expect(requestInstance.autoScore).toBe(0.2);
  });

  test("manualReview rejects request", async () => {
    const requestDoc = {
      _id: "req1",
      user: "u1",
      status: "pending",
      save: jest.fn().mockResolvedValue(),
    };
    const userDoc = {
      _id: "u1",
      save: jest.fn().mockResolvedValue(),
    };
    VerificationRequest.findById.mockResolvedValue(requestDoc);
    User.findById.mockResolvedValue(userDoc);

    const service = new VerificationService();
    const result = await service.manualReview("req1", "reviewer", "reject", "notes");

    expect(requestDoc.status).toBe("rejected");
    expect(result).toBe(requestDoc);
  });
});
