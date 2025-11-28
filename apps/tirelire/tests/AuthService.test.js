const AuthService = require("../src/services/AuthService");
const UserService = require("../src/services/UserService");
const jwtHelper = require("../src/config/jwt");
const validator = require("../src/utils/validator");

jest.mock("../src/services/UserService");
jest.mock("../src/config/jwt");
jest.mock("../src/utils/validator");

describe("AuthService", () => {
  let authService;
  let mockUserService;

  beforeEach(() => {
    mockUserService = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
    };
    UserService.mockImplementation(() => mockUserService);

    authService = new AuthService();
    jest.clearAllMocks();
  });

  // --- TEST REGISTER ---
  test("should register a new user successfully", async () => {
    const fakeData = {
      first_Name: "John",
      last_Name: "Doe",
      email: "john@example.com",
      adress: "123 Street",
      password: "secret",
    };

    validator.validateRegisterInputs.mockReturnValue({});

    mockUserService.getUserByEmail.mockResolvedValue(null);

    const createdUser = {
      email: "john@example.com",
      toObject: () => ({ email: "john@example.com", role: "user" }),
    };
    mockUserService.createUser.mockResolvedValue(createdUser);

    jwtHelper.createJWT.mockReturnValue("fake-jwt-token");

    const result = await authService.register(fakeData);

    expect(validator.validateRegisterInputs).toHaveBeenCalledWith(fakeData);
    expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
      "john@example.com",
    );
    expect(mockUserService.createUser).toHaveBeenCalled();
    expect(jwtHelper.createJWT).toHaveBeenCalledWith("john@example.com");
    expect(result).toEqual({
      token: "fake-jwt-token",
      user: { email: "john@example.com", role: "user" },
    });
  });

  test("should throw if email already exists", async () => {
    validator.validateRegisterInputs.mockReturnValue({});
    mockUserService.getUserByEmail.mockResolvedValue({
      email: "john@example.com",
    });

    await expect(
      authService.register({ email: "john@example.com" }),
    ).rejects.toThrow("Email already registered");
  });

  test("should login successfully with valid credentials", async () => {
    validator.validateLoginInputs.mockReturnValue({});
    const mockUser = {
      email: "john@example.com",
      password: "hashed",
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: () => ({ email: "john@example.com", role: "user" }),
    };
    mockUserService.getUserByEmail.mockResolvedValue(mockUser);
    jwtHelper.createJWT.mockReturnValue("jwt-token");

    const result = await authService.login("john@example.com", "secret");

    expect(validator.validateLoginInputs).toHaveBeenCalledWith(
      "john@example.com",
      "secret",
    );
    expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
      "john@example.com",
      { includePassword: true },
    );
    expect(mockUser.comparePassword).toHaveBeenCalledWith("secret");
    expect(result).toEqual({
      token: "jwt-token",
      user: { email: "john@example.com", role: "user" },
    });
  });

  test("should throw if invalid password", async () => {
    validator.validateLoginInputs.mockReturnValue({});
    const mockUser = {
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    mockUserService.getUserByEmail.mockResolvedValue(mockUser);

    await expect(
      authService.login("john@example.com", "wrong"),
    ).rejects.toThrow("Invalid password");
  });

  test("logout should return message", () => {
    const result = authService.logout();
    expect(result).toEqual({ message: "Logged out" });
  });

  test("should verify token correctly", () => {
    validator.isNonEmptyString.mockReturnValue(true);
    jwtHelper.verifyJWT.mockReturnValue(true);
    jwtHelper.decodeJWT.mockReturnValue({ email: "john@example.com" });

    const result = authService.verifyToken("some-token");
    expect(result).toEqual({
      valid: true,
      payload: { email: "john@example.com" },
    });
  });
});
