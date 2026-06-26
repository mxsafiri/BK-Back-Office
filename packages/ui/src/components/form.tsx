"use client";
import { cloneElement, isValidElement, useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, ReactElement } from "react";
import { cn } from "../lib/cn";

const FIELD =
  "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50";

/**
 * Associates the label with its control and wires hint/error for screen readers. Generates a
 * fallback id (useId) when the caller doesn't pass one, and sets aria-describedby + aria-invalid
 * on the child control by cloning it.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const autoId = useId();
  const childEl = isValidElement(children) ? (children as ReactElement<{ id?: string }>) : null;
  const fieldId = childEl?.props.id ?? htmlFor ?? autoId;
  const descId = hint || error ? `${fieldId}-desc` : undefined;

  const control = childEl
    ? cloneElement(childEl as ReactElement<Record<string, unknown>>, {
        id: fieldId,
        "aria-describedby": descId,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {control}
      {error ? (
        <p id={descId} className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={descId} className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={cn(FIELD, error ? "border-danger focus-visible:ring-danger" : "border-hairline", className)} {...rest} />;
}

export function Textarea({ className, error, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cn(FIELD, "min-h-20", error ? "border-danger" : "border-hairline", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD, "border-hairline appearance-none bg-no-repeat pr-9", className)} {...rest}>
      {children}
    </select>
  );
}
