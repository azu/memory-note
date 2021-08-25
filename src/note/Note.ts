import { uuid } from "@cfworker/uuid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

type SavedNote = {
    id: string;
    timestamp: number;
    message: string;
};
type NoteWithTimeStamp = {
    // unix timestamp
    timestamp: number;
    message: string;
};
type NoteWithDate = {
    // iso date
    date: string;
    message: string;
};
export type NoteArguments = NoteWithTimeStamp | NoteWithDate;
declare let MEMORY_NOTE: KVNamespace;
const isNoteWithTimeStamp = (n: any): n is NoteWithTimeStamp => {
    return "timestamp" in n;
};
export const writeNote = async (note: NoteArguments) => {
    const key = dayjs(isNoteWithTimeStamp(note) ? note.timestamp : note.date)
        .utc()
        .format("YYYY-MM-DD");
    const oldNodes = (await readNotes(key)) ?? [];
    const normalizedNode: SavedNote = isNoteWithTimeStamp(note)
        ? {
              id: uuid(),
              ...note
          }
        : {
              id: uuid(),
              message: note.message,
              timestamp: new Date(note.date).getTime()
          };
    await updateNotes(key, [normalizedNode].concat(oldNodes));
};

export const readNotesInRange = async (range: number): Promise<SavedNote[]> => {
    const today = dayjs().utc();
    const promise = await Promise.all(
        Array.from({ length: range })
            .fill(0)
            .map((_, index) => {
                const current = today.subtract(index, "day");
                const key = current.format("YYYY-MM-DD");
                return readNotes(key);
            })
    );
    return promise.flat();
};
export const updateNotes = async (key: string, notes: SavedNote[]): Promise<void> => {
    return await MEMORY_NOTE.put(`date:${key}`, JSON.stringify(notes));
};
export const readNotes = async (key: string): Promise<SavedNote[]> => {
    return JSON.parse((await MEMORY_NOTE.get(`date:${key}`)) ?? "[]");
};
export const readNoteAtDate = async (timestamp: number): Promise<SavedNote[]> => {
    const key = dayjs(timestamp).utc().format("YYYY-MM-DD");
    return readNotes(`date:${key}`);
};
export const deleteNote = async (nodeId: string): Promise<boolean> => {
    const today = dayjs();
    for (let i = 0; i < 20; i++) {
        const current = today.subtract(i, "day");
        const key = current.format("YYYY-MM-DD");
        const notes = await readNotes(key);
        const index = notes.findIndex((note) => note.id === nodeId);
        if (index === -1) {
            notes.splice(index, 1);
            await updateNotes(key, notes);
            return true;
        }
    }
    return false;
};
