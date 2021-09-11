import { Note, StorageAdapter } from "./StorageAdapter";

/**
 * Note stack Architecture
 *
 * # Add a new Note
 *
 * New Note
 *      ↓ Input = Push
 * ------------
 * |   Note   |
 * |   Note   |
 * |   Note   |
 * ------------- stack size limit
 * |  Note is flood |
 *     ↓ Output = Popup
 *
 * # Edit a Note
 *
 * 1. pop Note B
 * 2. push new Note B2 which has edited data
 *
 *      ↓ Input = Push
 * ------------
 * |   Note A   |
 * |   Note B |  → Output = Pop
 * |   Note C |
 * -------------
 *
 * →
 *
 * ------------
 * |   Note B2  |
 * |   Note A   |
 * |   Note C  |
 * ------------- stack size limit
 */
export type NoteArguments = {
    message: string;
};
export const createMemoryNote = (options: { storage: StorageAdapter }) => {
    const { storage } = options;
    const pushNote = async (key: string, note: NoteArguments, timestamp: number = Date.now()) => {
        return storage.appendNote(key, {
            ...note,
            timestamp
        });
    };

    const deleteNote = async (key: string, noteId: string): Promise<boolean> => {
        const deletedNote = await storage.deleteNote(key, noteId);
        return true;
    };

    const editNote = async (key: string, nodeId: string, note: NoteArguments): Promise<boolean> => {
        const deletedNote = await storage.deleteNote(key, nodeId);
        await pushNote(key, {
            ...deletedNote,
            ...note
        });
        return true;
    };

    const readNotes = async (key: string, range: number): Promise<Note[]> => {
        const currentNotes = await storage.getNotes(key);
        return currentNotes.slice(0, range);
    };

    const moveNote = async ({
        fromKey,
        toKey,
        nodeId
    }: {
        fromKey: string;
        toKey: string;
        nodeId: string;
    }): Promise<boolean> => {
        const deletedNote = await storage.deleteNote(fromKey, nodeId);
        await pushNote(toKey, deletedNote);
        return true;
    };
    return {
        pushNote,
        editNote,
        deleteNote,
        moveNote,
        readNotes
    };
};
