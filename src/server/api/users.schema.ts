import { z } from "zod";

export const createUserPayloadSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export const upadateUserPayloadSchema = z.object({
  oldUser: z.object({
    name: z.string(),
    pswd: z.string(),
  }),
  newUser: z.object({
    name: z.string(),
    pswd: z.string(),
  })
});

export type CreateUserPayload = z.infer<typeof createUserPayloadSchema>;
export type UpdateUserPayload = z.infer<typeof upadateUserPayloadSchema>;
