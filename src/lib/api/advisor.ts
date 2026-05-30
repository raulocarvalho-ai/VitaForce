import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAIRecommendation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        }),
      ),
      userProfile: z
        .object({
          age: z.string().optional(),
          gender: z.string().optional(),
          goal: z.string().optional(),
          diet: z.string().optional(),
          restrictions: z.string().optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { generateRecommendationOnServer } = await import("./advisor.server");
    return generateRecommendationOnServer(data.messages, data.userProfile);
  });
