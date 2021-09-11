import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { uuid } from "@cfworker/uuid";

declare let MEMORY_NOTE: KVNamespace;
export const createCloudflareStorage = ({ kvStorage = MEMORY_NOTE }: { kvStorage?: KVNamespace }): StorageAdapter => {
    return {
        async getNotes(noteKey: string): Promise<Note[]> {
            return JSON.parse((await kvStorage.get(noteKey)) ?? "[]");
        },
        async appendNote(noteKey: string, note: AppendNote): Promise<Note> {
            const currentNotes = await this.getNotes(noteKey);
            const newNote: Note = {
                id: uuid(),
                ...note
            };
            const nextNotes = [newNote].concat(currentNotes);
            await kvStorage.put(noteKey, JSON.stringify(nextNotes));
            return newNote;
        },
        async deleteNote(noteKey: string, id: Note["id"]): Promise<Note> {
            const currentNotes = await this.getNotes(noteKey);
            const index = currentNotes.findIndex((note) => note.id === id);
            if (index === -1) {
                throw new Error("not found note:" + id);
            }
            const [poppedNote] = currentNotes.splice(index, 1);
            await kvStorage.put(noteKey, JSON.stringify(currentNotes));
            return poppedNote;
        }
    };
};
