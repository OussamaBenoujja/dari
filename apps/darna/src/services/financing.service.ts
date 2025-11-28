import { Types } from "mongoose";
import FinancingApplication from "../models/financing-application";
import RealEstate from "../models/real-estate";
import Lead from "../models/lead";
import NotificationService from "./notification.service";
import TirelireService from "./tirelire.service";
import { ServiceError } from "./realEstate.service";

interface SimulationInput {
  amount: number;
  downPayment?: number;
  termMonths: number;
  annualRate: number;
}

interface ApplicationInput extends SimulationInput {
  userId: string;
  listingId?: string;
  leadId?: string;
  bankCode: string;
}

const BANKS = [
  {
    code: "BMCE",
    name: "Bank Of Africa",
    annualRate: 4.25,
    minTerm: 60,
    maxTerm: 360,
    maxLoanToValue: 0.85,
  },
  {
    code: "CIH",
    name: "CIH Bank",
    annualRate: 3.95,
    minTerm: 48,
    maxTerm: 300,
    maxLoanToValue: 0.9,
  },
  {
    code: "ATTIJARI",
    name: "Attijariwafa bank",
    annualRate: 4.4,
    minTerm: 60,
    maxTerm: 360,
    maxLoanToValue: 0.88,
  },
];

const findBankByCode = (code: string) => BANKS.find((bank) => bank.code === code.toUpperCase());

const simulateMonthlyPayment = ({ amount, downPayment = 0, termMonths, annualRate }: SimulationInput) => {
  const principal = amount - downPayment;
  if (principal <= 0) {
    throw new ServiceError("Loan amount must be greater than zero", 400);
  }
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    const monthlyPayment = principal / termMonths;
    return {
      monthlyPayment,
      totalInterest: 0,
      totalCost: monthlyPayment * termMonths,
      principal,
    };
  }
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
  const totalCost = monthlyPayment * termMonths;
  const totalInterest = totalCost - principal;
  return {
    monthlyPayment,
    totalInterest,
    totalCost,
    principal,
  };
};

class FinancingService {
  static listBanks() {
    return BANKS;
  }

  static simulate(input: SimulationInput) {
    return simulateMonthlyPayment(input);
  }

  static async createApplication(input: ApplicationInput) {
    const bank = findBankByCode(input.bankCode);
    if (!bank) {
      throw new ServiceError("Bank not supported", 404);
    }

    if (input.termMonths < bank.minTerm || input.termMonths > bank.maxTerm) {
      throw new ServiceError("Term out of range for this bank", 400);
    }

    const listing = input.listingId ? await RealEstate.findById(input.listingId) : null;
    const lead = input.leadId ? await Lead.findById(input.leadId) : null;

    if (input.listingId && !listing) {
      throw new ServiceError("Listing not found", 404);
    }

    const simulation = simulateMonthlyPayment(input);

    const application = await FinancingApplication.create({
      user: new Types.ObjectId(input.userId),
      listing: listing?._id,
      lead: lead?._id,
      amount: input.amount,
      downPayment: input.downPayment,
      termMonths: input.termMonths,
      annualRate: input.annualRate,
      bankCode: bank.code,
      simulation,
    });

    await NotificationService.createNotification({
      userId: input.userId,
      type: "financing.application",
      title: "Simulation enregistrée",
      message: `Votre demande auprès de ${bank.name} est soumise`,
      payload: {
        applicationId: application._id.toString(),
        bank: bank.name,
      },
    });

    return application;
  }

  static async proposeTirelireGroup(options: { name: string; contributionAmount: number; contributionInterval: string }) {
    return TirelireService.createSavingProposal(options);
  }

  static async listApplications(userId: string) {
    return FinancingApplication.find({ user: new Types.ObjectId(userId) })
      .populate("listing", "title price availability")
      .populate("lead", "status createdAt")
      .sort({ createdAt: -1 });
  }
}

export default FinancingService;
