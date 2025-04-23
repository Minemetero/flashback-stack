import { describe, it, expect } from 'vitest'
import flashback from '../src/flashback'

describe('Timeline basics', () => {
    it('save() pushes a snapshot and undo()/redo() traverse correctly', () => {
        const tl = flashback({ count: 0 })

        tl.change(d => (d.count += 1)) // count = 1
        tl.change(d => (d.count += 1)) // count = 2
        expect(tl.state.count).toBe(2)
        expect(tl.canUndo).toBe(true)
        expect(tl.canRedo).toBe(false)

        tl.undo()
        expect(tl.state.count).toBe(1)
        expect(tl.canRedo).toBe(true)

        tl.redo()
        expect(tl.state.count).toBe(2)
        expect(tl.canRedo).toBe(false)
    })

    it('clear() wipes history and disables undo/redo', () => {
        const tl = flashback(0)
        tl.save(1)
        tl.clear()

        expect(tl.canUndo).toBe(false)
        expect(tl.canRedo).toBe(false)
        expect(tl.state).toBe(1) // state itself isn’t reset
    })
})
