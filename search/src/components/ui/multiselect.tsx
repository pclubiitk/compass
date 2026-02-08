"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

type Option = Record<"value" | "label", string>;

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  theme = "default",
}: {
  options: Option[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  theme?: "default" | "puppylove";
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  const selectables = options.filter(
    (option) => !selected.includes(option.value)
  );

  return (
    <Command className="overflow-visible bg-transparent">
      <div
        className={cn(
          "group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          theme === "puppylove" &&
            "border-rose-200/80 bg-rose-100/70 text-rose-500 focus-within:ring-rose-300"
        )}
      >
        <div className="flex gap-1 flex-wrap">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <Badge
                key={value}
                variant="secondary"
                className={cn(
                  theme === "puppylove" &&
                    "bg-rose-100 text-rose-500 border border-rose-200/80"
                )}
              >
                {option?.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => handleUnselect(value)}
                >
                  <X
                    className={cn(
                      "h-3 w-3 text-muted-foreground hover:text-foreground",
                      theme === "puppylove" && "text-rose-400 hover:text-rose-500"
                    )}
                  />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ? placeholder : undefined}
            className={cn(
              "ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1",
              theme === "puppylove" && "text-rose-500 placeholder:text-rose-300"
            )}
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectables.length > 0 && (
          <div
            className={cn(
              "absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in",
              theme === "puppylove" &&
                "border-rose-200/80 bg-rose-50 text-rose-600"
            )}
          >
            <CommandGroup className="h-full max-h-60 overflow-auto">
              {selectables.map((option) => (
                <CommandItem
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onSelect={() => {
                    setInputValue("");
                    onChange([...selected, option.value]);
                  }}
                  className={cn(
                    "cursor-pointer",
                    theme === "puppylove" && "focus:bg-rose-100"
                  )}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  );
}
