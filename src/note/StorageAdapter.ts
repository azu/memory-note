export type Note = {
    id: string;
    message: string;
    timestamp: number;
};
export type AppendNote = {
    id?: string;
    message: string;
    timestamp: number;
};

export type StorageAdapter = {
    getNotes(noteKey: string): Promise<Note[]>;
    appendNote(noteKey: string, notes: AppendNote): Promise<Note>;
    deleteNote(noteKey: string, id: Note["id"]): Promise<Note>;
};
