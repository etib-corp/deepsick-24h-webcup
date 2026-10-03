"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

function SubmissionLifecycle({ release }: { release: () => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    if (!pending) release();
  }, [pending, release]);
  return null;
}

/** Block repeated submit events immediately, including before pending renders. */
export function SubmissionForm({ action, children, className }: {
  action: (data: FormData) => void;
  children: ReactNode;
  className?: string;
}) {
  const locked = useRef(false);
  const release = useCallback(() => { locked.current = false; }, []);

  return (
    <form action={action} className={className} onSubmitCapture={(event) => {
      if (locked.current) event.preventDefault();
      else locked.current = true;
    }}>
      <SubmissionLifecycle release={release} />
      {children}
    </form>
  );
}
