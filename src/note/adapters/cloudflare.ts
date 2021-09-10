import { AppendNote, Note, StorageAdapter } from "../StorageAdapter";
import { uuid } from "@cfworker/uuid";

export const createCloudflareStorage = ({
    key = "list:inbox",
    kvStorage
}: {
    key?: string;
    kvStorage: KVNamespace;
}): StorageAdapter => {
    return {
        async getNotes(): Promise<Note[]> {
            return JSON.parse((await kvStorage.get(key)) ?? "[]");
        },
        async appendNote(note: AppendNote): Promise<Note> {
            const currentNotes = await this.getNotes();
            const newNote: Note = {
                id: uuid(),
                ...note
            };
            const nextNotes = [newNote].concat(currentNotes);
            await kvStorage.put(key, JSON.stringify(nextNotes));
            return newNote;
        },
        async deleteNote(id: Note["id"]): Promise<Note> {
            const currentNotes = await this.getNotes();
            const index = currentNotes.findIndex((note) => note.id === id);
            if (index === -1) {
                throw new Error("not found note:" + id);
            }
            const [poppedNote] = currentNotes.splice(index, 1);
            await kvStorage.put(key, JSON.stringify(currentNotes));
            return poppedNote;
        }
    };
};
