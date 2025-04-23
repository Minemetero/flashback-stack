/** Public façade returned by flashback() */
export interface Timeline<T> {
    readonly state: T

    /** Push a complete snapshot */
    save(next: T): void

    /** Mutate a deep‑cloned draft of state */
    change(mutator: (draft: T) => void): void

    undo(): boolean
    redo(): boolean

    readonly canUndo: boolean
    readonly canRedo: boolean

    clear(): void

    /** Remove `n` oldest undo-snapshots and return them */
    prune(amount?: number): T[]
}

type CompressionHook<T> = (state: T) => Promise<T> | T

/**
 * Create a new undo/redo timeline.
 * @param initial	first value
 * @param compress	optional hook to compress snapshots before storing
 */
export default function flashback<T>(initial: T, compress?: CompressionHook<T>): Timeline<T> {
    let state = initial
    const undo: T[] = []
    const redo: T[] = []

    /** remove `n` oldest undo-snapshots and return them */
    const prune = (n = 1) => {
        const removed: T[] = []
        for (let i = 0; i < n && undo.length; i++) {
            removed.push(undo.shift()!)
        }
        return removed
    }

    const snapshot = async (next: T) => {
        const currentState = structuredClone(state)
        const compressedState = compress ? await compress(currentState) : currentState
        undo.push(compressedState)
        redo.length = 0
        state = next
    }

    return {
        get state() {
            return state
        },
        get canUndo() {
            return undo.length > 0
        },
        get canRedo() {
            return redo.length > 0
        },

        save(next) {
            snapshot(next)
        },

        change(fn) {
            const draft = structuredClone(state)
            fn(draft)
            snapshot(draft)
        },

        undo() {
            if (!undo.length) return false
            redo.push(state)
            state = undo.pop()!
            return true
        },

        redo() {
            if (!redo.length) return false
            undo.push(state)
            state = redo.pop()!
            return true
        },

        clear() {
            undo.length = redo.length = 0
        },

        prune,
    }
}
