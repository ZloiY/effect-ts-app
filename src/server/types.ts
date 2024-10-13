export const ERRORS = {
  USER_CREATION: "USER_CREATION",
  DB_ERROR: "DB_ERROR",
  TRANSACTION_ERROR: "TRANSACTION_ERROR",
  ROUTES_MIDDLEWARE_ERROR: "ROUTES_MIDDLEWARE_ERROR"
} as const;

export type MyServerError = {
  type: keyof typeof ERRORS;
  message: string;
};

