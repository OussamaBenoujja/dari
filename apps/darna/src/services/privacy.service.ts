import UserModel from "../models/user";

export interface UserDataExport {
  user: unknown;
  resources: Record<string, unknown>;
}

class PrivacyService {
  // Note: placeholder implementation until full GDPR tooling is built.
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await UserModel.findById(userId).lean();
    return {
      user,
      resources: {},
    };
  }

  static async deleteUserData(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { deletedAt: new Date() });
  }
}

export default PrivacyService;
