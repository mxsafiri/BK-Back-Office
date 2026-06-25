import type { FastifyInstance } from "fastify";
import { newId, type ClientId } from "@fimco/shared";
import type { KycApplicant, BankReference } from "@fimco/core";
import type { Container } from "../container.js";
import type { ApiConfig } from "../config.js";
import { authenticate, requireRoles } from "../auth.js";

interface OnboardBody {
  clientId?: string;
  externalId?: string;
  email?: string;
  applicant?: {
    fullName?: string;
    phoneNumber?: string;
    nationalId?: string;
    dateOfBirth?: string;
    bankReference?: BankReference;
  };
}

/** Onboard a client (operator-only). Validates input at the edge, delegates to the domain. */
export function registerOnboardingRoutes(app: FastifyInstance, deps: { container: Container; config: ApiConfig }): void {
  const { container, config } = deps;

  app.post(
    "/onboarding",
    { preHandler: [authenticate(config), requireRoles("operator")] },
    async (request, reply) => {
      const body = (request.body ?? {}) as OnboardBody;
      const a = body.applicant;
      if (
        typeof body.externalId !== "string" ||
        typeof body.email !== "string" ||
        !a ||
        typeof a.fullName !== "string" ||
        typeof a.phoneNumber !== "string"
      ) {
        return reply.code(400).send({ error: "invalid_body" });
      }

      // Build the applicant with exact-optional fields (omit, never set to undefined).
      const applicant: KycApplicant = {
        fullName: a.fullName,
        phoneNumber: a.phoneNumber,
        ...(typeof a.nationalId === "string" ? { nationalId: a.nationalId } : {}),
        ...(typeof a.dateOfBirth === "string" ? { dateOfBirth: a.dateOfBirth } : {}),
        ...(a.bankReference?.bankCode && a.bankReference?.customerRef ? { bankReference: a.bankReference } : {}),
      };

      const clientId = (typeof body.clientId === "string" ? body.clientId : newId("cli")) as ClientId;
      const outcome = await container.onboarding.onboard({
        clientId,
        externalId: body.externalId,
        email: body.email,
        applicant,
      });

      // 201 if an account was opened, 200 if KYC was rejected/pending (no account).
      return reply.code(outcome.account ? 201 : 200).send(outcome);
    },
  );
}
