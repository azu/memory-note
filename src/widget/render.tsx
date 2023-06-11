import { Widget } from "./widget";
import { html } from "hono/html";
import { Note } from "../note/StorageAdapter";

export const HTML = ({ notes }: { notes: Note[] }) => {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Memory Note</title>
                <style>{`
        html,body, #app {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: auto;
            max-width: 800px;
       }
       .NoteCount {
            position: fixed;
            top: 0;
            right: 0;
            font-size: 1.2rem;
            font-weight: bold;
            padding-top: 0.5rem;
            padding-right: 1rem;
        }
       .NoteList {
            list-style: none;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            font-size: 1rem;
            padding: 0.5rem 1rem;
        }
        .NoteListItem{ 
            border-bottom: 1px dotted #ddd;
            padding: 2px 0;
            cursor: pointer;
        }
       `}</style>
            </head>
            <body>
                <Widget notes={notes} />
                <script type="module">{`
        const deleteNote = (noteId) => {
            const deleteEndPoint = location.href.replace("/widget", "/" + noteId);
            return fetch(deleteEndPoint, {
                method: "DELETE"
            }).catch((error) => {
                console.error(error);
            });
        };
        document.querySelector("#list").addEventListener("click", async (event) => {
            const target = event.target;
            const noteId = target.dataset.noteId;
            if(!noteId){
                return;
            }
            const noteTitle = target.textContent;
            if (window.confirm("Do you want to delete: " + noteTitle)) {
                await deleteNote(noteId);
                target.remove();
            }
        }, true);
      `}</script>
            </body>
        </html>
    );
};
