# Flashback Stack – API Reference

> A micro-sized, zero-dependency **undo / redo timeline** for any serialisable
> JavaScript / TypeScript state.

```
npm i flashback-stack         # ESM only, requires Node ≥ 20
```

---

## Table of contents

1. [`flashback()` factory](#flashback-factory)
2. [`Timeline<T>` interface](#timelinet-interface)  
   2.1 [`state`](#state)  
   2.2 [`save()`](#save-next)  
   2.3 [`change()`](#change-mutator)  
   2.4 [`undo()` / `redo()`](#undo--redo)  
   2.5 [`canUndo` / `canRedo`](#canundo--canredo)  
   2.6 [`clear()`](#clear)  
   2.7 [`prune()`](#prune-amount--t)
3. [Typical usage patterns](#typical-usage-patterns)
4. [FAQ & edge-cases](#faq)

---

## `flashback()` factory

```ts
function flashback<T>(
    initial: T, // first snapshot (required)
    limit?: number // [optional] hard cap on undo history *
): Timeline<T>
```

| Parameter | Type      | Description                                                                                                                                                                |
| --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initial` | `T`       | The first state of your application or component.                                                                                                                          |
| `limit`   | `number?` | **Deprecated in 1.0.x**. Sets a soft maximum for undo history; nothing is removed automatically. Instead, call `timeline.prune()` when _you_ decide history should shrink. |

**Return value:** a live `Timeline<T>` object (documented below).

---

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
```

### `state`

_Getter._ The most-recent committed snapshot.

```ts
console.log(timeline.state) // always deep-frozen copy
```

---

### `save(next)`

Pushes an **entire copy** of `next` onto the undo stack and resets the redo
buffer.

```ts
timeline.save(newState)
```

---

### `change(mutator)`

Like [_Immer_](https://immerjs.github.io/immer/) in one line:

```ts
timeline.change(draft => draft.count++)
```

Internally `state` is cloned (`structuredClone`), the draft is passed to your
function, and the draft becomes the next committed snapshot.

---

### `undo()` / `redo()`

```ts
if (timeline.undo()) {
    console.log('stepped back ➜', timeline.state)
}
```

Both return `true` on success, `false` when the corresponding stack is empty.

---

### `canUndo` / `canRedo`

Booleans you can bind to **toolbar buttons**:

```html
<button :disabled="!tl.canUndo">Undo</button>
```

---

### `clear()`

Empties **both** history stacks but leaves the current `state` intact.

---

### `prune(amount = 1): T[]` <a id="prune-amount--t"></a>

Removes `amount` **oldest** snapshots from the _undo_ history and returns them
in eviction order.

```ts
const removed = timeline.prune(10) // deletes bottom-10
console.log(`freed ${removed.length} snapshots`)
```

- If `amount` > `undo.length`, everything is removed without error.
- Calling `prune()` with no argument deletes exactly one snapshot.

This manual control is preferred to the old automatic `limit` trimming, because
you decide **when** to free memory (e.g. after a prompt or when the stack size
warning turns red).

---

## Typical usage patterns

### Time-travel debugging

```ts
const tl = flashback(appState)

hook.onMessage(msg => {
    tl.change(s => reducer(s, msg))
})

window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'z') tl.undo()
    if (e.ctrlKey && e.key === 'y') tl.redo()
})
```

### Bounded history

```ts
const MAX = 100
if (timeline.canUndo && timeline.prune(1).length) {
    console.log('history trimmed to', MAX, 'entries')
}
```

Call this after a `save()` or on a timer.

### Resource clean-up

Snapshots may include file handles or WebGL textures:

```ts
tl.prune(5).forEach(tex => tex.dispose())
```

---

## FAQ

| Question                                | Answer                                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| _Is it safe for React/Vue/Solid state?_ | Yes—`save()` and `change()` deep-clone with `structuredClone`, so the timeline owns its own immutable snapshots. |
| _Why not JSON clone?_                   | `structuredClone` keeps `Map`, `Set`, `Date`, typed arrays, etc.                                                 |
| _Performance?_                          | Push/undo/redo are **O(1)** array operations. Cloning dominate cost—measure your state size.                     |
| _Can I serialise the whole timeline?_   | Sure: `JSON.stringify({ undo, redo, state })`.                                                                   |
