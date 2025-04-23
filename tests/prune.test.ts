import { describe, it, expect } from 'vitest'
import flashback from '../src/index'

describe('Timeline.prune()', () => {
    it('removes the single oldest snapshot when called with no args', () => {
        const tl = flashback<number>(0)
        ;[1, 2, 3].forEach(n => tl.save(n)) // undo = [0,1,2]

        const [evicted] = tl.prune() // default amount = 1
        expect(evicted).toBe(0) // oldest popped
        expect(tl.prune().length).toBe(1) // can prune again
    })

    it('removes n oldest snapshots and returns them in order', () => {
        const tl = flashback<number>(0)
        ;[1, 2, 3, 4].forEach(n => tl.save(n)) // undo = [0,1,2,3]

        const removed = tl.prune(3)
        expect(removed).toEqual([0, 1, 2])
        expect(tl.undo()).toBe(true)
        expect(tl.state).toBe(3) // remaining oldest
    })

    it('is tolerant if asked to prune more than available', () => {
        const tl = flashback(0) // no snapshots yet
        expect(tl.prune(5)).toEqual([]) // nothing to remove
    })
})
