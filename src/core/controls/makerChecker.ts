import { newId, type RequestId } from "../../shared/ids.js";
import { SegregationOfDutiesError, ValidationError } from "../../shared/errors.js";
import { AuditLog } from "./auditLog.js";

/**
 * Maker-checker (CLAUDE.md rule #3): every money- or position-moving action is proposed
 * by one user and approved by a DIFFERENT user before it executes. Enforced here in the
 * domain layer, not just the UI. No single user can move funds alone.
 */
export type RequestStatus = "pending" | "approved" | "rejected" | "executed";

export interface ApprovalRequest<TAction> {
  readonly id: RequestId;
  readonly action: TAction;
  readonly actionType: string;
  readonly proposedBy: string;
  approvedBy?: string;
  status: RequestStatus;
}

export class MakerCheckerRegistry {
  private readonly requests = new Map<RequestId, ApprovalRequest<unknown>>();

  constructor(private readonly audit: AuditLog) {}

  async propose<TAction>(
    actionType: string,
    action: TAction,
    proposedBy: string,
  ): Promise<ApprovalRequest<TAction>> {
    const req: ApprovalRequest<TAction> = {
      id: newId("req"),
      action,
      actionType,
      proposedBy,
      status: "pending",
    };
    this.requests.set(req.id, req as ApprovalRequest<unknown>);
    await this.audit.record({
      action: "maker_checker.propose",
      actor: proposedBy,
      subject: req.id,
      meta: { actionType },
    });
    return req;
  }

  /** Approve a pending request. Throws if approver === proposer (segregation of duties). */
  async approve<TAction>(id: RequestId, approvedBy: string): Promise<ApprovalRequest<TAction>> {
    const req = this.requests.get(id) as ApprovalRequest<TAction> | undefined;
    if (!req) throw new ValidationError(`Unknown request ${id}`);
    if (req.status !== "pending") throw new ValidationError(`Request ${id} is ${req.status}, not pending`);
    if (req.proposedBy === approvedBy) {
      throw new SegregationOfDutiesError("Approver must differ from proposer.");
    }
    req.approvedBy = approvedBy;
    req.status = "approved";
    await this.audit.record({
      action: "maker_checker.approve",
      actor: approvedBy,
      subject: req.id,
      meta: { actionType: req.actionType },
    });
    return req;
  }

  /**
   * Execute an approved request exactly once. The executor performs the real side effect
   * (e.g. an nTZS transfer). Idempotency is layered on by the caller.
   */
  async execute<TAction, TResult>(
    id: RequestId,
    executor: (action: TAction) => Promise<TResult>,
  ): Promise<TResult> {
    const req = this.requests.get(id) as ApprovalRequest<TAction> | undefined;
    if (!req) throw new ValidationError(`Unknown request ${id}`);
    if (req.status !== "approved") {
      throw new ValidationError(`Request ${id} must be approved before execution (is ${req.status}).`);
    }
    const result = await executor(req.action);
    req.status = "executed";
    await this.audit.record({
      action: "maker_checker.execute",
      actor: req.approvedBy ?? "system",
      subject: req.id,
      meta: { actionType: req.actionType },
    });
    return result;
  }
}
