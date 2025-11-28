import KeycloakAdminService from "./keycloak-admin.service";

class SecurityService {
  static async triggerVerificationEmail(keycloakUserId: string, force = false) {
    if (force) {
      await KeycloakAdminService.markEmailVerified(keycloakUserId);
      return { dispatched: false, forced: true };
    }
    await KeycloakAdminService.sendVerificationEmail(keycloakUserId);
    return { dispatched: true, forced: false };
  }

  static async enableTwoFactor(keycloakUserId: string) {
    await KeycloakAdminService.enableTotp(keycloakUserId);
  }

  static async disableTwoFactor(keycloakUserId: string) {
    await KeycloakAdminService.disableTotp(keycloakUserId);
  }

  static async twoFactorStatus(keycloakUserId: string) {
    const credentials = await KeycloakAdminService.listCredentials(keycloakUserId);
    const hasTotp = credentials.some((credential) => credential.type === "otp" || credential.type === "totp");
    return { enabled: hasTotp };
  }
}

export default SecurityService;
