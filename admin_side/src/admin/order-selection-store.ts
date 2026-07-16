import { useEffect, useSyncExternalStore } from "react";

type SelectedEntry = {
  documentId: string;
  total?: number | string | null;
};

type Listener = () => void;

let selectedEntries: SelectedEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setSelectedEntries(entries: SelectedEntry[]) {
  selectedEntries = entries;
  emit();
}

export function getSelectedEntries() {
  return selectedEntries;
}

export function subscribeSelectedEntries(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSelectedEntries() {
  return useSyncExternalStore(subscribeSelectedEntries, getSelectedEntries);
}

/** @deprecated use useSelectedEntries */
export const useSelectedOrders = useSelectedEntries;

/**
 * Bulk-action tracker (returns null so no button is shown).
 * Keeps header export/totals in sync with checkbox selection.
 */
export function TrackListSelection({
  documents,
}: {
  documents: Array<{ documentId?: string; total?: number | string | null }>;
  model: string;
}) {
  useEffect(() => {
    setSelectedEntries(
      documents
        .filter((doc) => Boolean(doc.documentId))
        .map((doc) => ({
          documentId: String(doc.documentId),
          total: doc.total,
        })),
    );

    return () => setSelectedEntries([]);
  }, [documents]);

  return null;
}

/** @deprecated use TrackListSelection */
export const TrackOrderSelection = TrackListSelection;
