import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { createMemoryNote, NoteArguments } from "./note/Note";
import { createGitHubProjectStorage } from "./note/adapters/GitHubProject";
import { createCloudflareStorage } from "./note/adapters/cloudflare";
import { jsx } from "hono/jsx";
import { HTML } from "./widget/render";
import { createNotionStorage } from "./note/adapters/Notion";

declare var MEMORY_NOTE_TOKEN: string;
declare var BACKEND_SERVICE: "github" | "cloudflare" | "notion";
declare var GITHUB_OWNER: string;
declare var GITHUB_REPO: string;
declare var GITHUB_PROJECT_ID: string;
if (
    typeof BACKEND_SERVICE === "string" &&
    BACKEND_SERVICE !== "github" &&
    BACKEND_SERVICE !== "cloudflare" &&
    BACKEND_SERVICE !== "notion"
) {
    throw new Error("BACKEND_SERVICE should github or cloudflare or notion");
}
const app = new Hono();
app.use("*", async (c, next) => {
    const token = c.req.query("token");
    if (!c.env?.MEMORY_NOTE_TOKEN) {
        return c.json(
            {
                message: "token is not defined"
            },
            400
        );
    }
    if (token !== c.env.MEMORY_NOTE_TOKEN) {
        return c.json(
            {
                message: "invalid token"
            },
            400
        );
    }
    await next();
});
app.use("*", cors());

const newMemoryNote = (c: Context) => {
    const backendService = c.env.BACKEND_SERVICE || "cloudflare";
    if (backendService === "notion") {
        if (!c.env.NOTION_TOKEN) {
            throw new Error("NOTION_TOKEN is not defined");
        }
        return createMemoryNote({
            storage: createNotionStorage({
                NOTION_API_TOKEN: c.env.NOTION_TOKEN,
                NOTION_MESSAGE_PROPERTY_NAME: c.env.NOTION_MESSAGE_PROPERTY_NAME,
                NOTION_FILTER_OPTIONS: c.env.NOTION_FILTER_OPTIONS
            })
        });
    } else if (backendService === "cloudflare") {
        return createMemoryNote({
            storage: createCloudflareStorage({
                kvStorage: c.env.MEMORY_NOTE
            })
        });
    } else if (backendService === "github") {
        return createMemoryNote({
            storage: createGitHubProjectStorage({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                projectId: Number(GITHUB_PROJECT_ID)
            })
        });
    }
    throw new Error("invalid backend service");
};

app.get("/notes/:listId", async (c) => {
    const key = c.req.param("listId");
    const limitValue = Number(c.req.query("limit")) || 10;
    if (limitValue < 0 || limitValue > 50) {
        return c.text("invalid limit: 0 ~ 50", 400);
    }
    const notes = await newMemoryNote(c).readNotes(key, limitValue);
    return c.json(notes, 200);
});
app.get("/notes/:listId/txt", async (c) => {
    const key = c.req.param("listId");
    const limitValue = Number(c.req.query("limit")) || 10;
    if (limitValue < 0 || limitValue > 50) {
        return c.text("invalid limit: 0 ~ 50", 400);
    }
    const notes = await newMemoryNote(c).readNotes(key, limitValue);
    return c.text(notes.map((note) => note.message).join("\n"), 200);
});
app.get("/notes/:listId/widget", async (c) => {
    const key = c.req.param("listId");
    const limitValue = Number(c.req.query("limit")) || 10;
    if (limitValue < 0 || limitValue > 50) {
        return c.text("invalid limit: 0 ~ 50", 400);
    }
    const notes = await newMemoryNote(c).readNotes(key, limitValue);
    return c.html(<HTML notes={notes} />);
});
app.post("/notes/:listId/new", async (c) => {
    const key = c.req.param("listId");
    const note = await c.req.json<NoteArguments>();
    if (!note) {
        return c.text("invalid note", 400);
    }
    await newMemoryNote(c).pushNote(key, note);
    return c.json({ ok: true }, 200);
});
app.post("/notes/:listId/move/:noteId", async (c) => {
    const key = c.req.param("listId");
    const noteId = c.req.param("noteId");

    const body = await c.req.json<{ to: string }>();
    if (!body) {
        return c.text("invalid body", 400);
    }
    if (!body.to) {
        return c.text("invalid body: missing to", 400);
    }
    await newMemoryNote(c).moveNote({
        fromKey: key,
        toKey: body.to,
        nodeId: noteId
    });
    return c.json({ ok: true }, 200);
});
app.put("/notes/:listId/:noteId", async (c) => {
    const key = c.req.param("listId");
    const noteId = c.req.param("noteId");
    const note = await c.req.json<NoteArguments>();
    if (!note) {
        return c.text("invalid note", 400);
    }
    await newMemoryNote(c).editNote(key, noteId, note);
    return c.json({ ok: true }, 200);
});
app.delete("/notes/:listId/:noteId", async (c) => {
    const key = c.req.param("listId");
    const noteId = c.req.param("noteId");
    if (!noteId) {
        return c.text("invalid node.id", 400);
    }
    await newMemoryNote(c).deleteNote(key, noteId);
    return c.json({ ok: true }, 200);
});

export default app;
