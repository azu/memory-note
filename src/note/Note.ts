import { uuid } from "@cfworker/uuid";

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
// pushed note
export type PrePushNote = (inputNode: SavedNote) => SavedNote | Promise<SavedNote>;
// popped nte
export type PostPoppedNote = (inputNode: SavedNote) => unknown | Promise<unknown>;
type SavedNote = {
    id: string;
    timestamp: number;
    message: string;
    tags: string[];
};
export type NoteArguments = {
    message: string;
    tags?: string[];
};
declare let MEMORY_NOTE: KVNamespace;
const INBOX_KEY = "list:inbox";
const updateNotes = async (key: string, notes: SavedNote[]): Promise<void> => {
    return await MEMORY_NOTE.put(key, JSON.stringify(notes));
};
const readNotes = async (key: string): Promise<SavedNote[]> => {
    return JSON.parse((await MEMORY_NOTE.get(key)) ?? "[]");
};
export const createMemoryNote = (middlewares: { prePushNote: PrePushNote; postPoppedNote: PostPoppedNote }) => {
    const pushNote = async (note: NoteArguments, timestamp: number = Date.now()) => {
        const currentNotes = await readNotes(INBOX_KEY);
        const newNote: SavedNote = await middlewares.prePushNote({
            id: uuid(),
            message: note.message,
            tags: note.tags ?? [],
            timestamp
        });
        const nextNotes = [newNote].concat(currentNotes);
        await updateNotes(INBOX_KEY, nextNotes);
    };

    const deleteNote = async (nodeId: string): Promise<boolean> => {
        const currentNotes = await readNotes(INBOX_KEY);
        const index = currentNotes.findIndex((note) => note.id === nodeId);
        if (index !== -1) {
            const [poppedNote] = currentNotes.splice(index, 1);
            await middlewares.postPoppedNote(poppedNote);
            await updateNotes(INBOX_KEY, currentNotes);
            return true;
        }
        return false;
    };

    const editNote = async (nodeId: string, note: NoteArguments): Promise<boolean> => {
        await deleteNote(nodeId);
        await pushNote(note);
        return true;
    };

    const readNotesInRange = async (range: number): Promise<SavedNote[]> => {
        const currentNotes = await readNotes(INBOX_KEY);
        return currentNotes.slice(0, range);
    };

    return {
        pushNote,
        editNote,
        deleteNote,
        readNotes: readNotesInRange
    };
};
