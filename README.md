# memory-note

## Usage

### set `API_TOKEN`

`API_TOKEN` should be random value. It is used for simple authorization.

```shell
$ wrangler secret put API_TOKEN
<INPUT_YOUR_API_TOKEN>
```

You need to access your memory note using `?token=<INPUT_YOUR_API_TOKEN>`.

## Overview

Two faces

- To do
- look back
- Context Todo
- Programmable Hooks

---

- Add note to Inbox
- Move note to another list from Inbox

## Backend Service

You can choose backend service by setting `BACKEND_SERVICE` env in [wrangler.toml](./wrangler.toml).

- `github`: GitHub Project Board
- `cloudflare`: Cloudflare Workers KV

## API

### `GET: /notes/:key`

Return an array of notes.

Parameters:

- `:key`: note key. This use-case is defined by adapter.

Query:

- `?limit`: result item count
- `&token`: Your Memory Note token

### `POST /notes/:key/new`

Post a note that following json data.

```typescript
type NoteBody = {
    message: string;
};
```

Example of post data.

```json
{
  "message": "test"
}
```

Parameters:

- `:key`: note key. This use-case is defined by adapter.

Query:

- `?token`: Your Memory Note token

### `PUT /notes/:key/:id`

Edit a note with the `:id`

```typescript
type NoteBody = {
    message: string;
};
```

Example of post data.

```json
{
  "message": "test"
}
```

Parameters:

- `:key`: note key. This use-case is defined by adapter.
- `:id`: note id. you can get the id from GET api

Query:

- `?token`: Your Memory Note token

### `DELET /notes/:key/:id`

Delete the note.

Parameters:

- `:key`: note key. This use-case is defined by adapter.
- `:id`: note id. you can get the id from GET api

Query:

- `?token`: Your Memory Note token
