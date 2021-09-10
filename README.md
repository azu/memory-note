# memory-note

## Usage

### set `API_TOKEN`

`API_TOKEN` should be random value. It is used for simple authorization.

```shell
$ wrangler secret put API_TOKEN
<INPUT_YOUR_API_TOKEN>
```

You need to access your memory note using `?token=<INPUT_YOUR_API_TOKEN>`.

### set `NOTE_STACK_SIZE`



```shell
$ wrangler secret put API_TOKEN
100
```

## Overview

Two faces

- To do
- look back
- Context Todo
- Programmable Hooks
- tag?

---

- Add note to Inbox
- Move note to another list from Inbox

## API

### `GET /notes/recents/:num?token=<INPUT_YOUR_API_TOKEN>`

Return an array of notes.

### `POST /notes/new?token=<INPUT_YOUR_API_TOKEN>`

Post a note that following json data.

```typescript
type NoteWithTimeStamp = {
  // unix timestamp
  timestamp: number;
  message: string;
};
type NoteWithDate = {
  // iso date
  date: string;
  message: string;
};
export type Note = NoteWithTimeStamp | NoteWithDate;
```

Example of post data.

```json
{
    "timestamp": 1629891907036,
    "message": "test"
}
```

or

```json
{
    "date": "2021-08-25T12:39:01.071Z",
    "message": "test"
}
```

### `DELETE /notes/:id`

Delete the note.
