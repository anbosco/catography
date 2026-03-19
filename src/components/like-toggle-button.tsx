"use client";

type LikeToggleButtonProps = {
  liked: boolean;
  count: number;
  onToggle?: () => void;
  compact?: boolean;
};

export function LikeToggleButton({
  liked,
  count,
  onToggle,
  compact = false,
}: LikeToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
        liked
          ? "border-[#f3a3be] bg-[#ffe3ef] text-accent-deep"
          : "border-border bg-white/80 text-muted hover:border-[#f3a3be] hover:text-accent-deep"
      } ${compact ? "px-2.5 py-1.5 text-xs" : ""}`}
      aria-pressed={liked}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
