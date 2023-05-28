import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { uuid } from "@cfworker/uuid";

export const createCloudflareStorage = ({ kvStorage }: { kvStorage: KVNamespace }): StorageAdapter => {
    return {
        async getNotes(listId: string): Promise<Note[]> {
            return JSON.parse((await kvStorage.get(listId)) ?? "[]");
        },
        async appendNote(listId: string, note: AppendNote): Promise<Note> {
            const currentNotes = await this.getNotes(listId);
            const newNote: Note = {
                id: uuid(),
                ...note
            };
            const nextNotes = [newNote].concat(currentNotes);
            await kvStorage.put(listId, JSON.stringify(nextNotes));
            return newNote;
        },
        async deleteNote(listId: string, nodeId: Note["id"]): Promise<Note> {
            const currentNotes = await this.getNotes(listId);
            const index = currentNotes.findIndex((note) => note.id === nodeId);
            if (index === -1) {
                throw new Error("not found note:" + nodeId);
            }
            const [poppedNote] = currentNotes.splice(index, 1);
            await kvStorage.put(listId, JSON.stringify(currentNotes));
            return poppedNote;
        }
    };
};
