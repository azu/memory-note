import { Handler, Router } from "worktop";
import * as Cache from "worktop/cache";
import * as CORS from "worktop/cors";
import { createMemoryNote, NoteArguments } from "./note/Note";
import { createGitHubProjectStorage } from "./note/adapters/GitHubProject";
import { createCloudflareStorage } from "./note/adapters/cloudflare";
import { render } from "./widget/render";

declare var MEMORY_NOTE_TOKEN: string;
declare var BACKEND_SERVICE: "github" | "cloudflare";
declare var GITHUB_OWNER: string;
declare var GITHUB_REPO: string;
declare var GITHUB_PROJECT_ID: string;
if (typeof BACKEND_SERVICE === "string" && BACKEND_SERVICE !== "github" && BACKEND_SERVICE !== "cloudflare") {
    throw new Error("BACKEND_SERVICE should github or cloudflare");
}
const backendService = typeof BACKEND_SERVICE !== "undefined" ? BACKEND_SERVICE : "cloudflare";
const API = new Router();
const memoryNote = createMemoryNote({
    storage:
        backendService === "github"
            ? createGitHubProjectStorage({
                  owner: GITHUB_OWNER,
                  repo: GITHUB_REPO,
                  projectId: Number(GITHUB_PROJECT_ID)
              })
            : createCloudflareStorage({})
});

const Auth: Handler<{ token: string }> = (req, res) => {
    const token = req.query.get("token");
    if (token !== MEMORY_NOTE_TOKEN) {
        res.send(400);
    }
};

/**
 * Handles `OPTIONS` requests using the same settings.
 * NOTE: Call `CORS.preflight` per-route for inidivual settings.
 */
API.prepare = (req, res) => {
    CORS.preflight({
        origin: "*", // allow any `Origin` to connect
        headers: ["Cache-Control", "Content-Type"],
        methods: ["GET", "HEAD", "PUT", "POST", "DELETE"]
    })(req as any, res);
    Auth(req as any, res);
};

API.add("GET", "/notes/:key", async (req, res) => {
    const key = req.params.key;
    const limitValue = Number(req.query.get("limit")) || 10;
    if (limitValue < 0 || limitValue > 50) {
        return res.send(400, "invalid limit: 0 ~ 50");
    }
    const notes = await memoryNote.readNotes(key, limitValue);
    res.send(200, notes);
});
API.add("GET", "/notes/:key/widget", async (req, res) => {
    const key = req.params.key;
    const limitValue = Number(req.query.get("limit")) || 10;
    if (limitValue < 0 || limitValue > 50) {
        return res.send(400, "invalid limit: 0 ~ 50");
    }
    const notes = await memoryNote.readNotes(key, limitValue);
    const html = await render({ notes });
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.send(200, html);
});
API.add("POST", "/notes/:key/new", async (req, res) => {
    const key = req.params.key;
    const note = await req.body<NoteArguments>();
    if (!note) {
        return res.send(400, "invalid note");
    }
    await memoryNote.pushNote(key, note);
    res.send(200, { ok: true });
});
API.add("POST", "/notes/:key/move/:id", async (req, res) => {
    const key = req.params.key;
    const noteId = req.params.id;
    const body = await req.body<{ to: string }>();
    if (!body) {
        return res.send(400, "invalid body");
    }
    if (!body.to) {
        return res.send(400, "invalid body: missing to");
    }
    await memoryNote.moveNote({
        fromKey: key,
        toKey: body.to,
        nodeId: noteId
    });
    res.send(200, { ok: true });
});
API.add("PUT", "/notes/:key/:id", async (req, res) => {
    const key = req.params.key;
    const id = req.params.id;
    const note = await req.body<NoteArguments>();
    if (!note) {
        return res.send(400, "invalid note");
    }
    await memoryNote.editNote(key, id, note);
    res.send(200, { ok: true });
});
API.add("DELETE", "/notes/:key/:id", async (req, res) => {
    const key = req.params.key;
    const nodeId = req.params.id;
    if (!nodeId) {
        return res.send(400, "invalid node.id");
    }
    await memoryNote.deleteNote(key, nodeId);
    res.send(200, { ok: true });
});

// Attach "fetch" event handler
// ~> use `Cache` for request-matching, when permitted
// ~> store Response in `Cache`, when permitted
Cache.listen(API.run);
