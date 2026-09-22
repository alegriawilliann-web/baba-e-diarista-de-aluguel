import { Elysia } from "elysia";
import { AppError } from "../errors";

/** Maps known AppError subclasses to consistent JSON responses; anything
 * unexpected logs server-side and returns a bare 500 without leaking
 * internals to the client. */
export const errorMiddleware = new Elysia({ name: "error-middleware" }).onError(({ error, set, code }) => {
  if (error instanceof AppError) {
    set.status = error.status;
    return { error: { code: error.code, message: error.message } };
  }

  if (code === "VALIDATION") {
    set.status = 422;
    return { error: { code: "VALIDATION_ERROR", message: error.message } };
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    return { error: { code: "NOT_FOUND", message: "Rota não encontrada" } };
  }

  console.error("[unhandled error]", error);
  set.status = 500;
  return { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } };
});
