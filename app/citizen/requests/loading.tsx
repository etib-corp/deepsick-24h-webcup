import { getDictionary } from "@/lib/i18n/server";

export default function Loading() {
  return <p role="status" className="py-6 text-sm text-muted-foreground">{getDictionary().citizen.tracking.loading}</p>;
}
