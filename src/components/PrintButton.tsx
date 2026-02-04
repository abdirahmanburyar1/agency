"use client";

export function PrintButton({
  children = "Print",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      {children}
    </button>
  );
}
