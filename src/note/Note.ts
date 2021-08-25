import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
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
export type Note = NoteWithTimeStamp | NoteWithDate;
declare let MEMORY_NOTE: KVNamespace;
const isNoteWithTimeStamp = (n: any): n is NoteWithTimeStamp => {
    return "timestamp" in n;
};
export const writeNote = async (note: Note) => {
    const key = dayjs(isNoteWithTimeStamp(note) ? note.timestamp : note.date)
        .utc()
        .format("YYYY-MM-DD");
    const oldNodes: Note[] = (await readNotes(key)) ?? [];
    await MEMORY_NOTE.put(key, JSON.stringify([note].concat(oldNodes)));
};

export const readNotesInRange = async (range: number): Promise<Note[]> => {
    const today = dayjs().utc();
    const promise = await Promise.all(
        Array.from({ length: range })
            .fill(0)
            .map((_, index) => {
                const current = today.subtract(index, "day");
                const key = current.format("YYYY-MM-DD");
                console.log(key);
                return readNotes(key);
            })
    );
    return promise.flat();
};
export const readNotes = async (key: string): Promise<Note[]> => {
    return JSON.parse((await MEMORY_NOTE.get(key)) ?? "[]");
};
export const readNoteAtDate = async (timestamp: number): Promise<Note[]> => {
    const key = dayjs(timestamp).utc().format("YYYY-MM-DD");
    return readNotes(key);
};
