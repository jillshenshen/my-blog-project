type Props = {
  children: React.ReactNode;
  className?: string;
};

export function SectionHeading({ children, className = "" }: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-foreground ${className}`}
    >
      <span className="h-px w-8 bg-[var(--color-border)]" aria-hidden />
      <h2 className="font-serif text-xl italic tracking-wide">{children}</h2>
      <span className="h-px w-8 bg-[var(--color-border)]" aria-hidden />
    </div>
  );
}
