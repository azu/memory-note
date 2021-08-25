import { Note, readNotes, writeNote } from "./note/Note";
import { Handler, Router } from "worktop";
import * as Cache from "worktop/cache";
import * as CORS from "worktop/cors";

declare var API_TOKEN: string;
const API = new Router();
const Auth: Handler<{ token: string }> = (req, res) => {
    const token = req.query.get("token");
    if (token !== API_TOKEN) {
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

API.add("GET", "/notes/:YYYYMMDD", async (req, res) => {
    const notes = await readNotes(req.params.YYYYMMDD);
    res.send(200, notes);
});
API.add("POST", "/notes/new", async (req, res) => {
    const note = await req.body<Note>();
    if (!note) {
        return res.send(400, "invalid note");
    }
    await writeNote(note);
    res.send(200, { ok: true });
});

// Attach "fetch" event handler
// ~> use `Cache` for request-matching, when permitted
// ~> store Response in `Cache`, when permitted
Cache.listen(API.run);
