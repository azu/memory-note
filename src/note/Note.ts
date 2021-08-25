import dayjs from "dayjs";

export type Note = {
    // unix timestamp
    timestamp: number;
    message: string;
};
declare let MEMORY_NOTE: KVNamespace;
export const writeNote = async (node: Note) => {
    const key = dayjs(node.timestamp).format("YYYY-MM-DD");
    const oldNodes: Note[] = (await readNotes(key)) ?? [];
    await MEMORY_NOTE.put(key, JSON.stringify([node].concat(oldNodes)));
};

export const readNotes = async (key: string): Promise<Note[]> => {
    return JSON.parse((await MEMORY_NOTE.get(key)) ?? "[]");
};
export const readNoteAtDate = async (timestamp: number): Promise<Note[]> => {
    const key = dayjs(timestamp).format("YYYY-MM-DD");
    return readNotes(key);
};
