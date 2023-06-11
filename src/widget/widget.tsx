import { jsx } from "hono/jsx";
import { Note } from "../note/StorageAdapter";
import type React from "react";

const List = ({ children, ...props }: React.JSX.IntrinsicElements["ul"]) => {
    return (
        // @ts-expect-error: why class?
        <ul class={"NoteList"} {...props}>
            {children}
        </ul>
    );
};
const ListItem = ({ note }: { note: Note }) => {
    return (
        // @ts-expect-error: why class?
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
            {/*// @ts-expect-error: why class?*/}
            <div class={"NoteCount"}>{notes.length}</div>
            <List id={"list"}>
                {notes.map((note) => {
                    return <ListItem key={note.id} note={note} />;
                })}
            </List>
        </div>
    );
};
