import { useState } from "react";
import { crestUrl } from "@/lib/crests";

const BOX = {
  sm: "size-8 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-lg",
} as const;

export function Crest({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: keyof typeof BOX;
}) {
  const url = src ?? crestUrl(name);
  const [ok, setOk] = useState(Boolean(url));
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const box = `flex shrink-0 items-center justify-center ${BOX[size]}`;

  if (url && ok) {
    return (
      <img
        src={url}
        alt=""
        title={name}
        width={size === "lg" ? 64 : size === "sm" ? 32 : 48}
        height={size === "lg" ? 64 : size === "sm" ? 32 : 48}
        loading="lazy"
        decoding="async"
        className={`${box} object-contain drop-shadow-md`}
        onError={() => setOk(false)}
      />
    );
  }

  return (
    <span
      title={name}
      className={`${box} rounded-full bg-surface font-black text-muted shadow-[var(--shadow-border)]`}
    >
      {initials || "·"}
    </span>
  );
}
