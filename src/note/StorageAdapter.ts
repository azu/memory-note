export type Note = {
    id: string;
    message: string;
    timestamp: number;
};
export type AppendNote = {
    /**
     * Allow to generate the id in storage internal
     */
    id?: string;
    message: string;
    timestamp: number;
};

/**
 * Storage Adapter should implement these methods
 */
export type StorageAdapter = {
    /**
     * Return an array of Note
     * @param listId
     */
    getNotes(listId: string): Promise<Note[]>;
    /**
     * Add the note to the list
     * Return the added note
     * @param listId
     * @param note
     */
    appendNote(listId: string, note: AppendNote): Promise<Note>;
    /**
     * Remove the note from the list
     * Return the deleted note
     * @param listId
     * @param id
     */
    deleteNote(listId: string, id: Note["id"]): Promise<Note>;
};
