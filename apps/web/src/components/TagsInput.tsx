import { KeyboardEvent, useRef } from "react";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
}

export function TagsInput({
  value,
  onChange,
  placeholder = "Add tags…",
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      commit(input.value);
    } else if (
      e.key === "Backspace" &&
      input.value === "" &&
      value.length > 0
    ) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div
      className="flex flex-wrap gap-1.5 bg-page rounded-cf-md px-3 py-2 shadow-[inset_0_0_0_1px_var(--cf-hairline)] focus-within:shadow-[inset_0_0_0_1px_rgba(80,101,72,0.45)] transition-shadow cursor-text min-h-[42px]"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-[rgba(80,101,72,0.12)] text-sage-deep rounded-cf-pill px-2.5 py-0.5 text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              remove(tag);
            }}
            aria-label={`Remove ${tag}`}
            className="text-ink-subtle hover:text-ink leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="flex-1 min-w-[100px] bg-transparent text-sm text-ink placeholder:text-ink-subtle outline-none"
        placeholder={value.length === 0 ? placeholder : ""}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          if (e.target.value.trim()) commit(e.target.value);
        }}
      />
    </div>
  );
}
