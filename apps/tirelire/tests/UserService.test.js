jest.mock("../src/models/User", () => {
  const ctor = jest.fn(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });
  ctor.findByEmail = jest.fn();
  ctor.findById = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  ctor.findByIdAndDelete = jest.fn();
  ctor.find = jest.fn();
  return ctor;
});

jest.mock("../src/services/VerificationService", () => jest.fn());

const User = require("../src/models/User");
const VerificationService = require("../src/services/VerificationService");
const UserService = require("../src/services/UserService");

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createUser persists new user", async () => {
    const service = new UserService();
    const result = await service.createUser("John", "Doe", "john@example.com", "addr", "pwd", "user");

    expect(User).toHaveBeenCalledWith({
      first_Name: "John",
      last_Name: "Doe",
      email: "john@example.com",
      adress: "addr",
      password: "pwd",
      role: "user",
    });
    expect(result.save).toHaveBeenCalled();
  });

  test("getUserByEmail forwards includePassword flag", async () => {
    const user = { email: "john@example.com" };
    User.findByEmail.mockResolvedValue(user);

    const service = new UserService();
    const result = await service.getUserByEmail("john@example.com", { includePassword: true });

    expect(User.findByEmail).toHaveBeenCalledWith("john@example.com", true);
    expect(result).toBe(user);
  });

  test("verifyPassword throws when user missing", async () => {
    User.findByEmail.mockResolvedValue(null);
    const service = new UserService();
    await expect(service.verifyPassword("a@example.com", "pwd")).rejects.toThrow("User not found");
  });

  test("login strips password before returning", async () => {
    const userDoc = {
      email: "a@example.com",
      password: "hashed",
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: () => ({ email: "a@example.com", password: "hashed", role: "user" }),
    };
    User.findByEmail.mockResolvedValue(userDoc);

    const service = new UserService();
    const result = await service.login("a@example.com", "secret");

    expect(userDoc.comparePassword).toHaveBeenCalledWith("secret");
    expect(result).toEqual({ email: "a@example.com", role: "user" });
  });

  test("submitVerificationRequest lazily creates verification service", async () => {
    const verificationMock = {
      submitVerification: jest.fn().mockResolvedValue("submitted"),
    };
    VerificationService.mockImplementation(() => verificationMock);

    const service = new UserService();
    const result = await service.submitVerificationRequest("u1", { payload: true });

    expect(VerificationService).toHaveBeenCalledTimes(1);
    expect(verificationMock.submitVerification).toHaveBeenCalledWith("u1", { payload: true });
    expect(result).toBe("submitted");
  });
});
