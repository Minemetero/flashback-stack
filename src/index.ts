/** Public façade returned by flashback() */
export interface Timeline<T> {
    readonly state: T

    /** Push a complete snapshot */
    save(next: T): Promise<this>

    /** Mutate a deep‑cloned draft of state */
    change(mutator: (draft: T) => void): Promise<this>

    undo(): boolean
    redo(): boolean

    readonly canUndo: boolean
    readonly canRedo: boolean

    clear(): void

    /** Remove `n` oldest undo-snapshots and return them */
    prune(amount?: number): T[]
}

type CompressionHook<T> = (state: T) => Promise<T> | T

interface Options {
    maxHistory?: number
}

/**
 * Create a new undo/redo timeline.
 * @param initial	first value
 * @param compress	optional hook to compress snapshots before storing
 * @param options	optional configuration
 */
export default function flashback<T>(
    initial: T,
    compress?: CompressionHook<T>,
    { maxHistory }: Options = {}
): Timeline<T> {
    let state = deepFreeze(initial)
    const undo: T[] = []
    const redo: T[] = []

    /** Deep freeze an object and its nested properties */
    function deepFreeze<U>(obj: U): U {
        if (obj === null || typeof obj !== 'object') return obj
        if (Object.isFrozen(obj)) return obj

        Object.freeze(obj)
        for (const key of Object.keys(obj)) {
            deepFreeze((obj as any)[key])
        }
        return obj
    }

    /** remove `n` oldest undo-snapshots and return them */
    const prune = (n = 1) => {
        return undo.splice(0, n)
    }

    const _snapshot = async (next: T) => {
        const currentState = structuredClone(state)
        let compressedState: T
        try {
            compressedState = compress ? await compress(currentState) : currentState
        } catch (err) {
            console.warn('Compression hook failed, storing raw snapshot', err)
            compressedState = currentState
        }
        undo.push(compressedState)
        redo.length = 0
        state = deepFreeze(next)

        // Auto-prune if maxHistory is set
        if (maxHistory != null && undo.length > maxHistory) {
            undo.splice(0, undo.length - maxHistory)
        }
    }

    return {
        get state() {
            return structuredClone(state)
        },
        get canUndo() {
            return undo.length > 0
        },
        get canRedo() {
            return redo.length > 0
        },

        async save(next) {
            await _snapshot(next)
            return this
        },

        async change(fn) {
            const draft = structuredClone(state)
            fn(draft)
            await _snapshot(draft)
            return this
        },

        undo() {
            if (!undo.length) return false
            redo.push(state)
            state = deepFreeze(undo.pop()!)
            return true
        },

        redo() {
            if (!redo.length) return false
            undo.push(state)
            state = deepFreeze(redo.pop()!)
            return true
        },

        clear() {
            undo.length = redo.length = 0
        },

        prune,
    }
}
