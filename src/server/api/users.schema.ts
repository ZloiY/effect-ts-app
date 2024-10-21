import { z } from "zod";

export const createUserPayloadSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export type CreateUserPayload = z.infer<typeof createUserPayloadSchema>;
