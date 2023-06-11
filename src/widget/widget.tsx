/** @jsx jsx */
/** @jsxFrag  Fragment */
import { jsx } from "hono/jsx";
import type { HTMLAttributes } from "react";
import { Note } from "../note/StorageAdapter";

const List = ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => {
    return (
        <ul class={"NoteList"} {...props}>
            {children}
        </ul>
    );
};
const ListItem = ({ note }: { note: Note }) => {
    return (
        <li class={"NoteListItem"} data-note-id={note.id}>
            {note.message}
        </li>
    );
};
export type WidgetProps = {
    notes: Note[];
};
export const Widget = ({ notes }: WidgetProps) => {
    return (
        <div id={"app"}>
            <div class={"NoteCount"}>{notes.length}</div>
            <List id={"list"}>
                {notes.map((note) => {
                    return <ListItem key={note.id} note={note} />;
                })}
            </List>
        </div>
    );
};
