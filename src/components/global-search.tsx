"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, User, CalendarClock, Loader2 } from "lucide-react";
import { globalSearch } from "@/app/global-search/actions";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: { id: string; name: string; phone: string }[];
    bookings: { id: string; booking_reference: string | null; customerName: string | null }[];
  }>({ customers: [], bookings: [] });
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const res = await globalSearch(q);
    setResults(res);
    setLoading(false);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setLoading(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      runSearch(value);
    }, 250);
  }

  function go(path: string) {
    setOpen(false);
    setQuery("");
    setResults({ customers: [], bookings: [] });
    router.push(path);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div className="relative w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="بحث عالمي"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">ابحث برقم الهاتف أو مرجع الحجز (مثل BK-2026-...)</span>
            </Button>
          }
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-none p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="أدخل رقم الهاتف أو مرجع الحجز..."
              value={query}
              onValueChange={handleInputChange}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري البحث...
                </div>
              )}
              {!loading && hasQuery && results.customers.length === 0 && results.bookings.length === 0 && (
                <CommandEmpty>لا توجد نتائج</CommandEmpty>
              )}
              {results.bookings.length > 0 && (
                <CommandGroup heading="الحجوزات">
                  {results.bookings.map((b) => (
                    <CommandItem key={b.id} onSelect={() => go(`/bookings/${b.id}`)}>
                      <CalendarClock className="ml-2 h-4 w-4" />
                      <span className="flex-1">{b.booking_reference || `#${b.id}`}</span>
                      {b.customerName && (
                        <span className="text-xs text-muted-foreground">{b.customerName}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.customers.length > 0 && (
                <CommandGroup heading="العملاء">
                  {results.customers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => go(`/customers/${c.id}`)}>
                      <User className="ml-2 h-4 w-4" />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {c.phone}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
