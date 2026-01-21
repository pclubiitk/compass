import React from "react";
import { Query } from "@/lib/types/data";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multiselect";
import { cn } from "@/lib/utils";

// NOTE:
// 1. Issue in implementing Debounce, as currently if we do so with the blow code,
// // it not only stops the query, it also stops the selection ui update (which looks a lot buggy)
// // Hence dropping it for now
//
// // const debouncedSetQuery = useCallback(
// //   debounce((newSelectedValues: string[]) => {
// //     props.setQuery({ ...props.query, [props.name]: newSelectedValues });
// //   }, 500),
// //   [props.setQuery, props.query, props.name] // Dependencies for useCallback
// // );
// // const handleSelectionChange = (newSelectedValues: string[]) => {
// //   debouncedSetQuery(newSelectedValues);
// // };

interface MSFProps {
  query: Query;
  setQuery: Function;
  name: keyof Query;
  label?: string;
  options: string[];
  disabled: boolean;
}

export default function MultiSelectField(props: MSFProps) {
  // Transform the simple string[] options into the { value, label }[] format
  const formattedOptions = props.options.map((option) => ({
    value: option,
    label: option,
  }));

  // Get the current selected values from the parent state, defaulting to an empty array
  const selectedValues = (props.query[props.name] as string[]) || [];

  // This function is passed to our MultiSelect component.
  // It receives the new array of selected values and updates the parent state.
  const handleSelectionChange = (newSelectedValues: string[]) => {
    props.setQuery({ ...props.query, [props.name]: newSelectedValues });
  };

  const displayLabel =
    props.label ||
    props.name.charAt(0).toUpperCase() + props.name.slice(1).toLowerCase();

  return (
    <div
      className={cn(
        "grid w-full items-center gap-1.5",
        props.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Label htmlFor={props.name}>{displayLabel}</Label>
      <div className={cn(props.disabled && "pointer-events-none")}>
        <MultiSelect
          options={formattedOptions}
          selected={selectedValues}
          onChange={handleSelectionChange}
          placeholder={
            selectedValues.length === 0 ? `Select ${displayLabel}` : ""
          }
        />
      </div>
    </div>
  );
}
