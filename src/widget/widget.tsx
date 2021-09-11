import React from "react";
import { FC } from "react";
import { Note } from "../note/StorageAdapter";

export type WidgetProps = {
    notes: Note[];
};
export const Widget: FC<WidgetProps> = ({ notes }) => {
    return (
        <div id={"app"}>
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    fontSize: "16px",
                    fontWeight: "bold",
                    paddingRight: "8px"
                }}
            >
                {notes.length}
            </div>
            <ul
                style={{
                    listStyle: "none",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    fontSize: "12px",
                    padding: "0.5rem 1rem"
                }}
            >
                {notes.map((note) => {
                    return (
                        <li key={note.id} style={{ borderBottom: "1px dotted #ddd", padding: "2px 0" }}>
                            {note.message}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
