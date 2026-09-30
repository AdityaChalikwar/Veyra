import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** `title` is the main text (defaults to `value`); `label` is a secondary line. */
export type Option<T extends string> = { value: T; title?: string; label?: string; icon?: LucideIcon };

type Props<T extends string> = {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  /** Multiple answers allowed (checkboxes) vs a single answer (radios). */
  multiple?: boolean;
  columns?: 2 | 3;
  ariaLabel: string;
};

export function OptionGrid<T extends string>({ options, selected, onToggle, multiple, columns = 2, ariaLabel }: Props<T>) {
  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      className={cn("grid gap-2.5 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3")}
    >
      {options.map(({ value, title, label, icon: Icon }) => {
        const isSelected = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={isSelected}
            onClick={() => onToggle(value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-left transition-colors",
              isSelected
                ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                : "border-line hover:border-line-strong hover:bg-canvas",
            )}
          >
            {Icon && (
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                  isSelected ? "bg-brand-600 text-white" : "bg-canvas text-ink-subtle",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{title ?? value}</span>
              {label && <span className="block text-xs text-ink-subtle">{label}</span>}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center border",
                multiple ? "rounded" : "rounded-full",
                isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong",
              )}
            >
              {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
