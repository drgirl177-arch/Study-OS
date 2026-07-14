import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: number;
};

export function Logo({ className, showWordmark = true, size = 40 }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span
        className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 via-cyan-500 to-sky-500 shadow-[0_20px_40px_rgba(56,189,248,0.18)]"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          className="w-[70%] h-[70%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 22C15 22 25.5 30 32 30C38.5 30 49 22 49 22V42C49 42 38.5 34 32 34C25.5 34 15 42 15 42V22Z"
            fill="white"
          />
          <path
            d="M22 34L32 24L42 34"
            stroke="#0EA5E9"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32 24V44"
            stroke="#0EA5E9"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <div className="leading-tight">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            GROFO
          </span>
          <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            AI learning OS
          </span>
        </div>
      )}
    </div>
  );
}
