# Flashback Stack – API Reference

## Installation

```bash
npm i flashback-stack         # ESM only, requires Node ≥ 20
```

## `flashback()` factory

```ts
function flashback<T>(
    initial: T, // first snapshot (required)
    compress?: CompressionHook<T> // [optional] hook to compress snapshots
): Timeline<T>
```

| Parameter  | Type                  | Description                                                                                    |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `initial`  | `T`                   | The first state of your application or component.                                              |
| `compress` | `CompressionHook<T>?` | Optional hook to transform/compress snapshots before storing in history. Can be sync or async. |

**Return value:** a live `Timeline<T>` object.

## `Timeline<T>` interface

```ts
interface Timeline<T> {
    readonly state: T
    save(next: T): void
    change(mutator: (draft: T) => void): void
    undo(): boolean
    redo(): boolean
    readonly canUndo: boolean
    readonly canRedo: boolean
    clear(): void
    prune(amount?: number): T[]
}
```

### `state`

_Getter._ The most-recent committed snapshot.

```ts
console.log(timeline.state) // always deep-frozen copy
```

### `save(next)`

Pushes an **entire copy** of `next` onto the undo stack and resets the redo buffer.

```ts
timeline.save(newState)
```

### `change(mutator)`

Like [_Immer_](https://immerjs.github.io/immer/) in one line:

```ts
timeline.change(draft => draft.count++)
```

Internally `state` is cloned (`structuredClone`), the draft is passed to your function, and the draft becomes the next committed snapshot.

### `undo()` / `redo()`

```ts
if (timeline.undo()) {
    console.log('stepped back ➜', timeline.state)
}
```

Both return `true` on success, `false` when the corresponding stack is empty.

### `canUndo` / `canRedo`

Booleans you can bind to **toolbar buttons**:

```html
<button :disabled="!tl.canUndo">Undo</button>
```

### `clear()`

Empties **both** history stacks but leaves the current `state` intact.

### `prune(amount = 1): T[]`

Removes `amount` **oldest** snapshots from the _undo_ history and returns them in eviction order.

```ts
const removed = timeline.prune(10) // deletes bottom-10
console.log(`freed ${removed.length} snapshots`)
```

- If `amount` > `undo.length`, everything is removed without error.
- Calling `prune()` with no argument deletes exactly one snapshot.

## Compression Hook

The compression hook allows you to transform or compress state before it's stored in history:

```ts
type CompressionHook<T> = (state: T) => Promise<T> | T
```

Example usage:

```ts
// Simple compression
const timeline = flashback(initialState, state => {
    return JSON.parse(JSON.stringify(state))
})

// Async compression
const timeline = flashback(initialState, async state => {
    const compressed = await compressLargeData(state)
    return compressed
})

// Selective storage
const timeline = flashback(initialState, state => {
    return {
        essential: state.essential,
        timestamp: Date.now(),
    }
})
```

## Performance Considerations

- Push/undo/redo are **O(1)** array operations
- Cloning dominates cost—measure your state size
- Compression hooks can help reduce memory usage
- Use `prune()` to manually manage history size

## Serialization

The timeline can be serialized:

```ts
JSON.stringify({ undo, redo, state })
```

## Type Safety

- Fully typed with TypeScript
- Works with any serializable state type
- Maintains type safety through compression hooks
