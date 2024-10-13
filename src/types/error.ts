import { ERRORS } from "../constants"

export type MyError = {
  type: typeof ERRORS[keyof typeof ERRORS]
  message: string;
}

export type ZodError = {
  type: typeof ERRORS['ZOD_PARSE_ERROR'];
  message: string
}
