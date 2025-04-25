# Flashback Stack

A **micro-sized**, zero-dependency **undo/redo timeline** for any serializable JavaScript/TypeScript state. Use it for time-travel debugging, state management, document editors, games, and more.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Code of Conduct](#code-of-conduct)
7. [License](#license)

---

## Installation

```bash
npm install flashback-stack
# Requires Node ≥ 20, ESM-only
```

## Quick Start

```ts
import flashback from 'flashback-stack'

async function demo() {
    // 1. Create a timeline with a 50-entry cap:
    const tl = flashback({ count: 0 }, undefined, { maxHistory: 50 })

    // 2. Make a change (async):
    await tl.change(draft => {
        draft.count += 2
    })
    console.log(tl.state) // { count: 2 }

    // 3. Save an explicit state:
    await tl.save({ count: 42 })

    // 4. Undo / redo:
    tl.undo() // returns true
    console.log(tl.state) // { count: 2 }
    tl.redo()
    console.log(tl.state) // { count: 42 }
}

demo()
```

## Features

- 🚀 **Tiny & Fast**: ~200 LOC, zero dependencies, O(1) undo/redo operations
- 🔒 **Type Safe**: Full TypeScript definitions
- 🧠 **Immutable**: Internally deep-frozen state with fresh clones on access
- 🔄 **Async & Chainable**: `save()`/`change()` return `Promise<this>` for `await` or chaining
- 🧩 **Flexible**: Sync/async compression hooks, plus `maxHistory` option

## API Reference

See [API.md](./API.md) for full details.

## Examples

### Keyboard Shortcuts

```ts
window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'z') tl.undo()
    if (e.ctrlKey && e.key === 'y') tl.redo()
})
```

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep this community welcoming and inclusive.

## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.
