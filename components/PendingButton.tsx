"use client";

type PendingButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  pending: boolean;
  pendingLabel?: string;
  children: React.ReactNode;
};

export function PendingButton({
  pending,
  pendingLabel = "Patientez...",
  children,
  className = "dash-btn",
  type = "submit",
  disabled,
  ...rest
}: PendingButtonProps) {
  return (
    <button type={type} className={className} disabled={pending || disabled} aria-busy={pending} {...rest}>
      {pending && <span className="btn-spinner" aria-hidden="true" />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
