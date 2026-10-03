import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import {
  assignReportAction,
  filePoliceCaseAction,
  updateReportStatusAction,
} from "@/lib/actions/reports";
import { format, getDictionary } from "@/lib/i18n/server";
import { REPORT_STATUSES } from "@/lib/roles";

/** Move an incident through its lifecycle and log a note. */
export async function ReportStatusForm({ reportId, status }: { reportId: string; status: string }) {
  const t = getDictionary();

  return (
    <form action={updateReportStatusAction} className="space-y-4" data-tour="status-form">
      <input type="hidden" name="reportId" value={reportId} />

      <Field label={t.ops.forms.status} htmlFor="status">
        <Select id="status" name="status" defaultValue={status}>
          {REPORT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t.reportStatus[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t.ops.forms.note} htmlFor="note" hint={t.ops.forms.noteHint}>
        <Textarea id="note" name="note" placeholder={t.ops.forms.notePlaceholder} />
      </Field>

      <Button type="submit" className="w-full">
        {t.ops.forms.save}
      </Button>
    </form>
  );
}

export async function ReportAssignButton({
  reportId,
  assigneeName,
}: {
  reportId: string;
  assigneeName?: string | null;
}) {
  const t = getDictionary();

  return (
    <form action={assignReportAction} className="space-y-2" data-tour="assign">
      <input type="hidden" name="reportId" value={reportId} />
      <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {assigneeName ? format(t.ops.forms.unitLabel, { name: assigneeName }) : t.ops.forms.noUnit}
      </p>
      <Button type="submit" variant="secondary" size="sm" className="w-full">
        {assigneeName ? t.ops.forms.reassign : t.ops.forms.takeCharge}
      </Button>
    </form>
  );
}

/** Simulated arrest + PV, security only. */
export async function PoliceCaseForm({
  reportId,
  existing,
}: {
  reportId: string;
  existing?: {
    suspectName: string | null;
    arrestNotes: string | null;
    fineAmount: number | null;
    pvContent: string | null;
  } | null;
}) {
  const t = getDictionary();

  return (
    <form action={filePoliceCaseAction} className="space-y-3" data-tour="police-case">
      <input type="hidden" name="reportId" value={reportId} />

      <Field label={t.ops.forms.suspect} htmlFor="suspectName">
        <Input
          id="suspectName"
          name="suspectName"
          defaultValue={existing?.suspectName ?? ""}
          placeholder={t.ops.forms.suspectPlaceholder}
        />
      </Field>

      <Field label={t.ops.forms.arrestNotes} htmlFor="arrestNotes">
        <Textarea id="arrestNotes" name="arrestNotes" defaultValue={existing?.arrestNotes ?? ""} />
      </Field>

      <Field label={t.ops.forms.fine} htmlFor="fineAmount">
        <Input id="fineAmount" name="fineAmount" type="number" min={0} defaultValue={existing?.fineAmount ?? ""} />
      </Field>

      <Field label={t.ops.forms.pv} htmlFor="pvContent">
        <Textarea id="pvContent" name="pvContent" defaultValue={existing?.pvContent ?? ""} />
      </Field>

      <Button type="submit" variant="secondary" className="w-full">
        {existing ? t.ops.forms.updateCase : t.ops.forms.openCase}
      </Button>
    </form>
  );
}
