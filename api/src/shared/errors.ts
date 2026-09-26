export class AppError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(404, "NOT_FOUND", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para fazer isso") {
    super(403, "FORBIDDEN", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos") {
    super(422, "VALIDATION_ERROR", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com o estado atual do recurso") {
    super(409, "CONFLICT", message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.") {
    super(429, "TOO_MANY_REQUESTS", message);
  }
}
