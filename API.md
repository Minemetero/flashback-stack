# Flashback Stack – API Reference

## Installation

```bash
npm i flashback-stack         # ESM only, requires Node ≥ 20
```

## `flashback()` factory

```ts
function flashback<T>(
    initial: T,                            // first snapshot (required)
    compress?: CompressionHook<T>,         // [optional] hook to compress snapshots
    options?: { maxHistory?: number }      // [optional] cap on stored undo snapshots
): Timeline<T>
``` 

| Parameter    | Type                             | Description                                                                                                  |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `initial`    | `T`                              | The first state of your application or component.                                                            |
| `compress`   | `CompressionHook<T>?`            | Optional hook to transform/compress snapshots before storing. Can be sync or async.                          |
| `options`    | `{ maxHistory?: number }?`       | If provided, automatically evicts oldest snapshots when the undo stack exceeds this size.                    |

**Return value:** a live `Timeline<T>` object.

---

## `Timeline<T>` interface

```ts
interface Timeline<T> {
  /** Always returns a fresh deep-clone of the current state. */
  readonly state: T

  /** Push a complete snapshot and reset redo; returns `this` for chaining. */
  save(next: T): Promise<this>

  /** Mutate a draft of state, snapshot result; returns `this`. */
  change(mutator: (draft: T) => void): Promise<this>

  /** Step backward; returns `true` on success, `false` if no history. */
  undo(): boolean

  /** Step forward; returns `true` on success, `false` if no redo. */
  redo(): boolean

  /** Whether there is at least one undo snapshot. */
  readonly canUndo: boolean

  /** Whether there is at least one redo snapshot. */
  readonly canRedo: boolean

  /** Clear both undo & redo stacks (current state remains). */
  clear(): void

  /** Remove `n` oldest undo snapshots and return them. */
  prune(amount?: number): T[]
}
``` 

### `state`

_Getter._ Returns a deep-cloned copy of the internal state (ensuring immutability). 

### `save(next)`

Pushes a **complete** snapshot (after optional compression) onto the undo stack, clears redo, and makes `next` the new current state. Returns a `Promise<this>` so you can `await` or chain calls. 

### `change(mutator)`

Clones current state, applies your `mutator(draft)`, then snapshots the result. Returns a `Promise<this>`. 

### `undo()` / `redo()`

```ts
if (await timeline.undo()) {
  console.log('stepped back ➜', timeline.state)
}
```

Return `true` on success, `false` when no history. 

### `canUndo` / `canRedo`

Booleans you can bind to UI controls:

```html
<button :disabled="!tl.canUndo">Undo</button>
``` 

### `clear()`

Empties both history stacks but leaves the current `state` intact. 

### `prune(amount = 1): T[]`

Removes the `amount` **oldest** undo snapshots via `splice(0, amount)`, returns them in eviction order. 


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
