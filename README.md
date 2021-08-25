# memory-note

## Usage

### set `API_TOKEN`

```ts
$ wrangler secret put API_TOKEN
<INPUT_YOUR_API_TOKEN>
```

You need to access your memory note using `?token=<INPUT_YOUR_API_TOKEN>`.

## API

### `GET /notes/YYYY-MM-DD`

Return an array of note at YYYY-MM-DD.

### `POST /notes/new`

Post a note that following json data.

```typescript
export type Note = {
  // unix timestamp
  timestamp: number;
  message: string;
}
```

Example of post data.

```json
{
    "timestamp": 1629891907036,
    "message": "test"
}
```
