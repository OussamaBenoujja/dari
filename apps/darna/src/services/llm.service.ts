import {
  OPENROUTER_API_KEY,
  OPENROUTER_API_URL,
  OPENROUTER_MODEL,
  OPENROUTER_SITE_TITLE,
  OPENROUTER_SITE_URL,
} from "../config/openrouter";

export interface ListingSummary {
  title: string;
  description: string;
  transactionType: string;
  price: number;
  currency: string;
  location: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  characteristics?: Record<string, unknown>;
  equipmentList?: string[];
  internalRules?: string[];
}

interface PriceEstimationInput {
  listing: ListingSummary;
  comparablePriceSamples?: Array<{ label: string; price: number }>;
  imageUrls?: string[];
}

export interface PriceEstimationResult {
  minPrice: number;
  maxPrice: number;
  currency: string;
  confidence?: number;
  reasoning?: string;
  providerModel: string;
  raw: unknown;
}

type OpenRouterMessageContent =
  | string
  | Array<
      | string
      | {
          type: "text";
          text: string;
        }
      | {
          type: "image_url";
          image_url: {
            url: string;
          };
        }
    >;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: OpenRouterMessageContent;
}

interface OpenRouterChoice {
  message?: {
    content?: OpenRouterMessageContent;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  id?: string;
  error?: {
    message?: string;
  };
}

const buildListingSummaryText = (listing: ListingSummary, comparableSamples?: Array<{ label: string; price: number }>) => {
  const equipment = listing.equipmentList && listing.equipmentList.length > 0 ? listing.equipmentList.join(", ") : "N/A";
  const rules = listing.internalRules && listing.internalRules.length > 0 ? listing.internalRules.join(", ") : "Standard";
  const coordinates = listing.location.coordinates
    ? `(${listing.location.coordinates.latitude}, ${listing.location.coordinates.longitude})`
    : "Unknown";

  const comps = comparableSamples && comparableSamples.length > 0
    ? `\nComparable price samples:\n${comparableSamples
        .map((sample) => `- ${sample.label}: ${sample.price.toLocaleString("en-US")} ${listing.currency}`)
        .join("\n")}`
    : "";

  return `Property overview:
- Title: ${listing.title}
- Transaction Type: ${listing.transactionType}
- Current Asking Price: ${listing.price.toLocaleString("en-US")} ${listing.currency}
- Location: ${listing.location.address ?? "N/A"} (${listing.location.city ?? ""}, ${listing.location.country ?? ""})
- Coordinates: ${coordinates}
- Key Features: ${equipment}
- Internal Rules: ${rules}

Description:
${listing.description}
${comps}`;
};

const buildMessages = (summary: string, imageUrls?: string[]): OpenRouterMessage[] => {
  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    {
      type: "text",
      text: `${summary}\n\nReturn a strict JSON object with the shape { "minPrice": number, "maxPrice": number, "currency": string, "confidence": number between 0 and 1, "reasoning": string }. Use ${OPENROUTER_MODEL} for reasoning.`,
    },
  ];

  if (imageUrls && imageUrls.length > 0) {
    imageUrls.slice(0, 3).forEach((url) => {
      userContent.push({
        type: "image_url",
        image_url: { url },
      });
    });
  }

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "You are an expert real-estate valuation assistant. Analyze the provided property context (including any images) and produce realistic price guidance tailored to the local market. Respond ONLY with valid JSON.",
    },
    {
      role: "user",
      content: userContent,
    },
  ];

  return messages;
};

const materializeContent = (content: OpenRouterMessageContent | undefined): string => {
  if (!content) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  return content
    .map((chunk) => {
      if (!chunk) {
        return "";
      }
      if (typeof chunk === "string") {
        return chunk;
      }
      if (chunk.type === "text") {
        return chunk.text ?? "";
      }
      return chunk.image_url?.url ?? "";
    })
    .join("\n")
    .trim();
};

const extractJson = (raw: string) => {
  if (!raw) {
    return null;
  }
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const jsonCandidate = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonCandidate);
  } catch (_) {
    return null;
  }
};

export class LlmService {
  static async requestPriceEstimation({ listing, comparablePriceSamples, imageUrls }: PriceEstimationInput): Promise<PriceEstimationResult> {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const summary = buildListingSummaryText(listing, comparablePriceSamples);
    const messages = buildMessages(summary, imageUrls);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        ...(OPENROUTER_SITE_URL ? { "HTTP-Referer": OPENROUTER_SITE_URL } : {}),
        ...(OPENROUTER_SITE_TITLE ? { "X-Title": OPENROUTER_SITE_TITLE } : {}),
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter request failed with status ${response.status}: ${errorBody}`);
    }

    const body = (await response.json()) as OpenRouterResponse;
    if (body.error?.message) {
      throw new Error(body.error.message);
    }

    const choice = body.choices?.[0];
    if (!choice) {
      throw new Error("OpenRouter response did not include choices");
    }

    const serializedContent = materializeContent(choice.message?.content);
    const parsed = extractJson(serializedContent);

    if (!parsed || typeof parsed.minPrice !== "number" || typeof parsed.maxPrice !== "number") {
      throw new Error("Unable to parse price estimation from LLM response");
    }

    return {
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
      currency: parsed.currency ?? listing.currency,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : undefined,
      providerModel: OPENROUTER_MODEL,
      raw: {
        responseId: body.id,
        content: serializedContent,
        parsed,
      },
    };
  }
}

export default LlmService;
