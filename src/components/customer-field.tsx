"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomerOption = { id: string; name: string; phone: string };

// Discriminated selection reported to the parent:
//   existing -> pick an already-registered customer
//   new      -> create a brand-new customer with the provided name/phone
export type CustomerSelection =
  | { kind: "existing"; id: string; name: string; phone: string }
  | { kind: "new"; name: string; phone: string }
  | null;

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function CustomerField({
  customers,
  value,
  onChange,
  placeholder = "اكتب اسم العميل أو أول ٣ أرقام من الهاتف...",
  ariaLabel = "بحث عن عميل",
}: {
  customers: CustomerOption[];
  value: CustomerSelection;
  onChange: (sel: CustomerSelection) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newMode, setNewMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Existing customer selected? Provide a convenient summary label.
  const selectedLabel = useMemo(() => {
    if (value?.kind === "existing") return `${value.name} - ${value.phone}`;
    return "";
  }, [value]);

  const results = useMemo(() => {
    if (!open) return [];
    const q = normalize(query);
    if (!q) return customers;
    return customers.filter((c) => {
      const name = normalize(c.name);
      const phone = c.phone.replace(/[^0-9]/g, "");
      const qDigits = q.replace(/[^0-9]/g, "");
      if (qDigits && phone.startsWith(qDigits)) return true;
      return name.includes(q);
    });
  }, [customers, query, open]);

  function pickExisting(c: CustomerOption) {
    onChange({ kind: "existing", id: c.id, name: c.name, phone: c.phone });
    setNewMode(false);
    setOpen(false);
  }

  function enterNewMode() {
    // Prefill from the typed query: if it looks like a phone (digits), put it in
    // the phone field, otherwise treat it as the customer name.
    const hasLetters = /[\p{L}]/u.test(query);
    if (hasLetters) {
      setNewName(query.trim());
      setNewPhone("");
    } else {
      setNewPhone(query.replace(/[^0-9\s+]/g, "").trim());
      setNewName("");
    }
    setNewMode(true);
    setOpen(false);
  }

  function commitNew() {
    if (!newName.trim() || !newPhone.trim()) return;
    onChange({ kind: "new", name: newName.trim(), phone: newPhone.trim() });
  }

  // New-customer editing inputs.
  if (newMode) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            عميل جديد
          </Label>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => {
              setNewMode(false);
              onChange(null);
            }}
          >
            اختيار عميل موجود
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">اسم العميل</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="اسم العميل"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">رقم الهاتف</Label>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className="text-left"
            />
          </div>
        </div>
        <Button type="button" size="sm" onClick={commitNew} disabled={!newName.trim() || !newPhone.trim()}>
          {value?.kind === "new" ? "تحديث بيانات العميل الجديد" : "تأكيد العميل الجديد"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel}
              className="w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2 truncate">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedLabel || placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-none p-0" align="start">
          <Command>
            <CommandInput
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>لا يوجد عميل مطابق</CommandEmpty>
              <CommandGroup heading="العملاء المطابقون">
                {results.map((c) => {
                  const isSelected = value?.kind === "existing" && value.id === c.id;
                  return (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.phone}`}
                      onSelect={() => pickExisting(c)}
                    >
                      <Check className={cn("ml-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {c.phone}
                      </span>
                    </CommandItem>
                  );
                })}
                {query.trim() !== "" && (
                  <CommandItem value={`create ${query}`} onSelect={enterNewMode}>
                    <UserPlus className="ml-2 h-4 w-4" />
                    <span>إضافة عميل جديد بهذه البيانات</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value?.kind === "existing" && (
        <p className="px-1 text-xs text-emerald-600">تم اختيار: {value.name} — {value.phone}</p>
      )}
    </div>
  );
}
