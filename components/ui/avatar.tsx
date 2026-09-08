import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-base",
};

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent ring-2 ring-surface",
        SIZE_CLASSES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
}: {
  people: { name: string; avatarUrl?: string | null }[];
  max?: number;
}) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((person, i) => (
        <div
          key={i}
          className="relative"
          style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: visible.length - i }}
        >
          <Avatar
            name={person.name}
            src={person.avatarUrl}
            size="sm"
            className="ring-[2.5px] ring-card"
          />
        </div>
      ))}
      {overflow > 0 && (
        <div className="relative" style={{ marginLeft: "-6px", zIndex: 0 }}>
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-[2.5px] ring-card">
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}
