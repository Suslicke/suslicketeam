"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { leadSchema, projectTypes, type LeadInput } from "@/lib/lead-schema";
import { getStoredUtm } from "@/lib/utm";

type Status = "idle" | "submitting" | "success" | "error";

// `LeadInput` (the schema's output) is the shape we work with everywhere. We
// use zod's input type for the form's raw field values so react-hook-form's
// resolver generics line up under zod 4 without an overload mismatch.
type FormValues = z.input<typeof leadSchema>;

// `@hookform/resolvers@5.4.0` was compiled against `zod/v4/core` from zod 3.25's
// compat layer, whose `$ZodType` internals (e.g. `version.minor`) diverge from
// standalone `zod@4.4.3`. The resolver works correctly at runtime — only the
// static `$ZodType` literal types disagree — so we bridge the schema to the
// resolver's expected parameter type once here, rather than weakening the
// schema itself (our single source of truth).
type ZodResolverSchema = Parameters<typeof zodResolver>[0];
const leadResolver = zodResolver(
  leadSchema as unknown as ZodResolverSchema,
) as unknown as Resolver<FormValues, unknown, LeadInput>;

/**
 * Map a react-hook-form field name to a friendly, localized error message.
 * The validation rules live solely in `leadSchema` (single source of truth);
 * here we only translate the *which field failed* into human copy, keyed by
 * field name so we never duplicate the zod constraints themselves.
 */
function fieldErrorKey(name: "name" | "contact" | "projectType"): string {
  switch (name) {
    case "name":
      return "errors.name";
    case "contact":
      return "errors.contact";
    case "projectType":
      return "errors.projectType";
    default:
      return "errors.generic";
  }
}

export function LeadForm() {
  const t = useTranslations("leadForm");
  const [status, setStatus] = useState<Status>("idle");
  const formId = useId();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<FormValues, unknown, LeadInput>({
    resolver: leadResolver,
    defaultValues: {
      name: "",
      contact: "",
      message: "",
      company: "",
    },
  });

  const projectType = watch("projectType");

  async function onSubmit(values: LeadInput) {
    setStatus("submitting");

    const payload: LeadInput = {
      ...values,
      // Strip the honeypot before sending; it must stay empty anyway.
      company: undefined,
      page: typeof window !== "undefined" ? window.location.pathname : undefined,
      utm: getStoredUtm(),
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      trackEvent("lead_form_submit", {
        projectType: values.projectType,
        page: payload.page,
      });
      setStatus("success");
    } catch {
      // Network error — keep the entered values so the user can retry.
      setStatus("error");
    }
  }

  function onInvalid() {
    // Focus the first field that failed validation for keyboard/AT users.
    const order = ["name", "contact", "projectType", "message"] as const;
    const first = order.find((field) => errors[field]);
    if (first) setFocus(first);
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-6 py-12 text-center"
      >
        <CheckCircle2 className="size-10 text-brand" />
        <h2 className="font-display text-lg font-semibold">
          {t("success_title")}
        </h2>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">
          {t("success_text")}
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold">{t("heading")}</h2>
        <p className="text-sm text-muted-foreground">{t("subheading")}</p>
      </div>

      {/* Honeypot: off-screen, hidden from AT and tab order. Bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor={`${formId}-company`}>Company</label>
        <input
          id={`${formId}-company`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-name`} className="text-sm font-medium">
          {t("name_label")}
        </label>
        <Input
          id={`${formId}-name`}
          autoComplete="name"
          disabled={submitting}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${formId}-name-error` : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id={`${formId}-name-error`} className="text-sm text-destructive">
            {t(fieldErrorKey("name"))}
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-contact`} className="text-sm font-medium">
          {t("contact_label")}
        </label>
        <Input
          id={`${formId}-contact`}
          autoComplete="tel"
          placeholder={t("contact_placeholder")}
          disabled={submitting}
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={
            errors.contact ? `${formId}-contact-error` : undefined
          }
          {...register("contact")}
        />
        {errors.contact && (
          <p
            id={`${formId}-contact-error`}
            className="text-sm text-destructive"
          >
            {t(fieldErrorKey("contact"))}
          </p>
        )}
      </div>

      {/* Project type */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-projectType`} className="text-sm font-medium">
          {t("projectType_label")}
        </label>
        <Select
          value={projectType}
          onValueChange={(value) =>
            setValue("projectType", value as LeadInput["projectType"], {
              shouldValidate: true,
            })
          }
          disabled={submitting}
        >
          <SelectTrigger
            id={`${formId}-projectType`}
            className="h-10 w-full"
            aria-invalid={errors.projectType ? true : undefined}
            aria-describedby={
              errors.projectType ? `${formId}-projectType-error` : undefined
            }
          >
            <SelectValue placeholder={t("projectType_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`projectTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.projectType && (
          <p
            id={`${formId}-projectType-error`}
            className="text-sm text-destructive"
          >
            {t(fieldErrorKey("projectType"))}
          </p>
        )}
      </div>

      {/* Message (optional) */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${formId}-message`}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {t("message_label")}
          <span className="text-xs font-normal text-muted-foreground">
            {t("optional")}
          </span>
        </label>
        <Textarea
          id={`${formId}-message`}
          rows={4}
          placeholder={t("message_placeholder")}
          disabled={submitting}
          {...register("message")}
        />
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
        >
          <span className="font-medium text-destructive">
            {t("error_title")}
          </span>
          <span className="text-muted-foreground">{t("error_text")}</span>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="h-11 bg-brand text-base text-brand-foreground hover:bg-brand/90"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting
          ? t("submitting")
          : status === "error"
            ? t("retry")
            : t("submit")}
      </Button>
    </form>
  );
}
