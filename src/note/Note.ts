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
    const pushNote = async (note: NoteArguments, timestamp: number = Date.now()) => {
        return storage.appendNote({
            ...note,
            timestamp
        });
    };

    const deleteNote = async (noteId: string): Promise<boolean> => {
        const deletedNote = await storage.deleteNote(noteId);
        return true;
    };

    const editNote = async (nodeId: string, note: NoteArguments): Promise<boolean> => {
        await storage.deleteNote(nodeId);
        await pushNote(note);
        return true;
    };

    const readNotesInRange = async (range: number): Promise<Note[]> => {
        const currentNotes = await storage.getNotes();
        return currentNotes.slice(0, range);
    };

    return {
        pushNote,
        editNote,
        deleteNote,
        readNotes: readNotesInRange
    };
};
