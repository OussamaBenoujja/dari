import axios from "axios";

const TIRELIRE_BASE_URL = process.env.TIRELIRE_BASE_URL || "http://tirelire-api:3002/api";

class TirelireService {
  static async getAuthToken() {
    const email = process.env.TIRELIRE_SERVICE_EMAIL;
    const password = process.env.TIRELIRE_SERVICE_PASSWORD;
    if (!email || !password) {
      throw new Error("Tirelire service credentials are not configured");
    }
    const response = await axios.post(`${TIRELIRE_BASE_URL}/users/login`, { email, password });
    return response.data?.token as string;
  }

  static async createSavingProposal(payload: { name: string; contributionAmount: number; contributionInterval: string }) {
    const token = await this.getAuthToken();
    const response = await axios.post(`${TIRELIRE_BASE_URL}/groups`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  static async listGroups() {
    const token = await this.getAuthToken();
    const response = await axios.get(`${TIRELIRE_BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

export default TirelireService;
