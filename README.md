# memory-note

## Usage

### set `API_TOKEN`

```ts
$ wrangler secret put API_TOKEN
<INPUT_YOUR_API_TOKEN>
```

You need to access your memory note using `?token=<INPUT_YOUR_API_TOKEN>`.

## API

### `GET /notes/YYYY-MM-DD?token=<INPUT_YOUR_API_TOKEN>`

Return an array of note at YYYY-MM-DD.

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
