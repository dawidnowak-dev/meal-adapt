import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { ServerError } from "@/components/ServerError";
import { useExclusions, type ExclusionsError, type PendingAction } from "@/components/hooks/useExclusions";
import { Button } from "@/components/ui/button";
import type { SelectableExclusion } from "@/lib/catalog/selectable-exclusions";
import { searchExclusions } from "@/lib/catalog/exclusion-search";
import { cn } from "@/lib/utils";
import type { ExclusionDTO } from "@/types";

interface Props {
  initialExclusions: ExclusionDTO[];
  selectableExclusions: SelectableExclusion[];
}

const sectionClass = "rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl sm:p-6";
const headingClass = "mb-4 text-lg font-semibold text-blue-50";
const rowClass = "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-white/5 px-3 py-2";
const actionClass = "min-h-11 min-w-28 rounded-lg px-4 text-sm font-medium transition-colors";

function Spinner() {
  return (
    <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

function ErrorMessage({ error }: { error: ExclusionsError | null }) {
  if (!error) return null;
  if (error.kind === "message") return <ServerError message={error.message} />;
  return (
    <ServerError
      message={
        <>
          Twoja sesja wygasła.{" "}
          <a href="/auth/signin" className="font-medium text-red-100 underline">
            Zaloguj się ponownie
          </a>
          , aby zarządzać wykluczeniami.
        </>
      }
    />
  );
}

function PendingLabel({ action }: { action: PendingAction }) {
  return (
    <>
      <Spinner />
      {action === "adding" ? "Zapisywanie…" : "Usuwanie…"}
    </>
  );
}

export default function ExclusionsManager({ initialExclusions, selectableExclusions }: Props) {
  const { exclusions, pending, error, addExclusion, removeExclusion } = useExclusions(initialExclusions);
  const [query, setQuery] = useState("");
  const searchId = useId();

  const { matches, isUnsupported } = useMemo(
    () => searchExclusions(query, selectableExclusions),
    [query, selectableExclusions],
  );
  const addedIds = useMemo(() => new Set(exclusions.map((item) => item.productId)), [exclusions]);
  const trimmedQuery = query.trim();

  // The clicked button is disabled or unmounted by the action, so focus is restored explicitly
  // once the server-confirmed state has rendered.
  const [status, setStatus] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  // CSS selectors tried in order after the next render; the first enabled match receives focus.
  const focusTarget = useRef<string[] | null>(null);

  useEffect(() => {
    const selectors = focusTarget.current;
    const root = rootRef.current;
    if (!selectors || !root) return;
    for (const selector of selectors) {
      const target = root.querySelector<HTMLElement>(selector);
      if (!target) continue;
      if (target instanceof HTMLButtonElement && target.disabled) return; // retry after pending clears
      target.focus();
      focusTarget.current = null;
      return;
    }
  });

  const removeButton = (productId: string) => `[data-remove-id="${CSS.escape(productId)}"]`;
  const addButton = (productId: string) => `[data-add-id="${CSS.escape(productId)}"]`;

  const handleAdd = async (item: SelectableExclusion) => {
    setStatus("");
    focusTarget.current = null;
    const ok = await addExclusion(item.id);
    if (ok) setStatus(`Dodano: ${item.name}.`);
    focusTarget.current = [ok ? removeButton(item.id) : addButton(item.id)];
  };

  const handleRemove = async (item: ExclusionDTO) => {
    setStatus("");
    focusTarget.current = null;
    const index = exclusions.findIndex((entry) => entry.productId === item.productId);
    const neighbours = [exclusions.at(index + 1), index > 0 ? exclusions.at(index - 1) : undefined];
    const ok = await removeExclusion(item.productId);
    if (ok) setStatus(`Usunięto: ${item.name}.`);
    focusTarget.current = ok
      ? [...neighbours.flatMap((entry) => (entry ? [removeButton(entry.productId)] : [])), "#your-exclusions-heading"]
      : [removeButton(item.productId)];
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <div aria-live="polite">
        <ErrorMessage error={error} />
      </div>
      <p role="status" className="sr-only">
        {status}
      </p>

      <section aria-labelledby="your-exclusions-heading" className={sectionClass}>
        <h2 id="your-exclusions-heading" tabIndex={-1} className={headingClass}>
          Twoje wykluczenia
        </h2>
        {exclusions.length === 0 ? (
          <p className="text-sm text-blue-100/70">
            Nie masz jeszcze żadnych wykluczeń. Dodaj produkty z katalogu poniżej.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {exclusions.map((item) => {
              const action = pending[item.productId];
              return (
                <li key={item.productId} className={rowClass}>
                  <div className="flex min-w-0 flex-col">
                    <span className="break-words">{item.name}</span>
                    {!item.supported && (
                      <span className="text-xs text-amber-200/90">Nieobsługiwane w obecnym katalogu</span>
                    )}
                  </div>
                  <Button
                    data-remove-id={item.productId}
                    type="button"
                    variant="ghost"
                    disabled={action !== undefined}
                    aria-label={action ? undefined : `Usuń ${item.name}`}
                    onClick={() => void handleRemove(item)}
                    className={cn(
                      actionClass,
                      "border border-white/20 text-red-200 hover:bg-red-500/20 hover:text-red-100",
                    )}
                  >
                    {action ? (
                      <PendingLabel action={action} />
                    ) : (
                      <>
                        <Trash2 aria-hidden="true" />
                        Usuń
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="add-exclusions-heading" className={sectionClass}>
        <h2 id="add-exclusions-heading" className={headingClass}>
          Dodaj z katalogu
        </h2>
        <div role="search" className="mb-4">
          <label htmlFor={searchId} className="mb-1 block text-sm text-blue-100/80">
            Szukaj produktu
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <input
              id={searchId}
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              onKeyDown={(event) => {
                // Typed text is never saved: Enter does nothing.
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder="np. mleko"
              className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 pl-10 text-white placeholder-white/40 transition-colors focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />
          </div>
        </div>

        <div aria-live="polite">
          {isUnsupported && trimmedQuery !== "" && (
            <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-900/30 px-3 py-2 text-sm text-amber-100">
              „{trimmedQuery}” nie jest obsługiwanym wykluczeniem i nie zostanie uwzględnione. Wybierz produkt z listy.
            </p>
          )}
        </div>

        {matches.length === 0 ? (
          <p className="text-sm text-blue-100/70">Brak pasujących produktów w katalogu.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.map((item) => {
              const added = addedIds.has(item.id);
              const busy = pending[item.id] !== undefined;
              // A removal in progress is shown in "Twoje wykluczenia"; here the row keeps its "Dodane" state.
              const action = pending[item.id] === "adding" ? "adding" : undefined;
              return (
                <li key={item.id} className={rowClass}>
                  <span className="min-w-0 break-words">{item.name}</span>
                  <Button
                    data-add-id={item.id}
                    type="button"
                    variant="ghost"
                    disabled={added || busy}
                    aria-label={added || busy ? undefined : `Dodaj ${item.name}`}
                    onClick={() => void handleAdd(item)}
                    className={cn(
                      actionClass,
                      added
                        ? "border border-white/10 text-blue-100/70"
                        : "bg-purple-600 text-white hover:bg-purple-500 hover:text-white",
                    )}
                  >
                    {action ? (
                      <PendingLabel action={action} />
                    ) : added ? (
                      <>
                        <Check aria-hidden="true" />
                        Dodane
                      </>
                    ) : (
                      <>
                        <Plus aria-hidden="true" />
                        Dodaj
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
