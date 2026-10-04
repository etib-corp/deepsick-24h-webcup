"use client";

import { createContext, forwardRef, useContext, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { Input as ShadcnInput } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea as ShadcnTextarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/ui";

const SELECT_BASE =
  "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 md:text-sm";

const FieldHintContext = createContext<{ controlId: string; hintId?: string } | null>(null);

function useFieldDescription(id?: string, describedBy?: string) {
  const field = useContext(FieldHintContext);
  return [describedBy, field?.controlId === id ? field?.hintId : undefined]
    .filter(Boolean).join(" ") || undefined;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  const hintId = useId();
  return (
    <FieldHintContext.Provider value={{ controlId: htmlFor, hintId: hint ? hintId : undefined }}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={htmlFor} className="font-mono text-xs uppercase tracking-wide text-foreground">
          {label}
        </Label>
        {children}
        {hint ? <span id={hintId} className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </FieldHintContext.Provider>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    const describedBy = useFieldDescription(props.id, props["aria-describedby"]);
    return (
      <ShadcnInput
        ref={ref}
        className={cn("font-mono", className)}
        {...props}
        aria-describedby={describedBy}
      />
    );
  },
);

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const describedBy = useFieldDescription(props.id, props["aria-describedby"]);
  return <ShadcnTextarea className={cn("min-h-28 font-mono", className)} {...props} aria-describedby={describedBy} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const describedBy = useFieldDescription(props.id, props["aria-describedby"]);
  return (
    <select className={cn(SELECT_BASE, "font-mono", className)} {...props} aria-describedby={describedBy}>
      {children}
    </select>
  );
}
