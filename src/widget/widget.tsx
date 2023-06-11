import React, { HTMLAttributes } from "react";
import { FC } from "react";
import { Note } from "../note/StorageAdapter";

const List = ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => {
    return (
        <ul
            style={{
                listStyle: "none",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                fontSize: "1rem",
                padding: "0.5rem 1rem"
            }}
            {...props}
        >
            {children}
        </ul>
    );
};
const ListItem = ({ note }: { note: Note }) => {
    return (
        <li style={{ borderBottom: "1px dotted #ddd", padding: "2px 0", cursor: "pointer" }} data-note-id={note.id}>
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
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    paddingTop: "0.5rem",
                    paddingRight: "1rem"
                }}
            >
                {notes.length}
            </div>
            <List id={"list"}>
                {notes.map((note) => {
                    return <ListItem key={note.id} note={note} />;
                })}
            </List>
        </div>
    );
};
