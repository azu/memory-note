# memory-note [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/azu/memory-note)

## Usage

1. Click
2. Create Cloudflare API token for deploy
   1. Visit <https://dash.cloudflare.com/profile/api-tokens>
   2. Create new API token
   3. Select "Editing Cloudflare Workers" template
   4. Copy the API token

### set `MEMORY_NOTE_TOKEN`

`MEMORY_NOTE_TOKEN` should be random value. It is used for simple authorization.

```shell
$ wrangler secret put MEMORY_NOTE_TOKEN
<INPUT_YOUR_MEMORY_NOTE_TOKEN>
```

You need to access your memory note using `?token=<INPUT_YOUR_MEMORY_NOTE_TOKEN>`.

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
