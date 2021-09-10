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
    getNotes(): Promise<Note[]>;
    appendNote(notes: AppendNote): Promise<Note>;
    deleteNote(id: Note["id"]): Promise<Note>;
};
