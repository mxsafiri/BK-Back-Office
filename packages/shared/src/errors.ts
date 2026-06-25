/** Base for all domain errors. Carry a machine-readable code for the API layer. */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super("validation_error", message);
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string) {
    super("authorization_error", message);
  }
}

/** Thrown when an action that requires maker-checker is misused. */
export class SegregationOfDutiesError extends DomainError {
  constructor(message: string) {
    super("segregation_of_duties", message);
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(message: string) {
    super("insufficient_funds", message);
  }
}

/** A securities debit would take a holding below zero (no short-selling on cash accounts). */
export class InsufficientHoldingsError extends DomainError {
  constructor(message: string) {
    super("insufficient_holdings", message);
  }
}

/** An external party (nTZS, DSE, CSD, KYC) returned an error or an unusable response. */
export class ExternalServiceError extends DomainError {
  constructor(
    public readonly service: string,
    message: string,
    public readonly status?: number,
  ) {
    super("external_service_error", message);
  }
}
