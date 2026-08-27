"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAirports, getAirportLabel, findAirportByCode, type Airport } from "@/lib/airports";

export function AirportCombobox({
  value,
  onChange,
  placeholder = "اختر المطار...",
  ariaLabel,
}: {
  value?: string;
  onChange: (airport: Airport) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = value ? findAirportByCode(value.split(" (")[0]) : undefined;

  const results = useMemo(() => (open ? searchAirports(query) : []), [open, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            type="button"
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <Plane className="h-4 w-4 shrink-0 text-muted-foreground" />
              {selected ? getAirportLabel(selected) : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-none p-0" align="start">
        <Command>
          <CommandInput
            placeholder="ابحث عن مطار، مدينة، أو دولة..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup>
              {results.map((airport) => {
                const label = getAirportLabel(airport);
                const isSelected = selected?.code === airport.code;
                return (
                  <CommandItem
                    key={airport.code}
                    value={`${airport.code} ${airport.nameAr} ${airport.cityAr} ${airport.countryAr}`}
                    onSelect={() => {
                      onChange(airport);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("ml-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
