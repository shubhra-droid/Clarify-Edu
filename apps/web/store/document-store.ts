import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UploadedDocument } from "@/types";

export interface DocumentStore {
    documents: UploadedDocument[];
    selectedDocumentId: string | null;
    addDocument: (doc: UploadedDocument) => void;
    setSelectedDocumentId: (id: string) => void;
    clearDocuments: () => void;
}

export const useDocumentStore = create<DocumentStore>()(
    persist(
        (set) => ({
            documents: [],
            selectedDocumentId: null,

            addDocument: (doc) =>
                set((state) => {
                    const existingFiltered = state.documents.filter(d => d.id !== doc.id);
                    const newDocs = [doc, ...existingFiltered];
                    return { documents: newDocs, selectedDocumentId: doc.id };
                }),

            setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),

            clearDocuments: () => set({ documents: [], selectedDocumentId: null }),
        }),
        {
            name: "clarify-edu-docs",
        }
    )
);
