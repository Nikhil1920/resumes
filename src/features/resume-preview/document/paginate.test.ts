import { describe, expect, it } from 'vitest'

import { combineFlows, paginateFlow, singlePage, type FlowMeasurement } from './paginate'

/** Builds a measurement from group layouts: each group has a heading height and unit heights, stacked with gaps. */
function layout(groups: Array<{ heading: number; units: number[]; repeat?: boolean }>, gap = 10, itemGap = 4): FlowMeasurement {
  const measurement: FlowMeasurement = { groups: [], units: [] }
  let y = 0
  groups.forEach((group, groupIndex) => {
    const top = y
    y += group.heading
    measurement.groups.push({ top, headingHeight: group.heading, repeatHeading: group.repeat ?? true })
    group.units.forEach((height, item) => {
      if (item > 0) y += itemGap
      measurement.units.push({ group: groupIndex, item, top: y, bottom: y + height })
      y += height
    })
    y += gap
  })
  return measurement
}

describe('paginateFlow', () => {
  it('keeps everything on one page when it fits', () => {
    const measurement = layout([{ heading: 0, units: [100], repeat: false }, { heading: 20, units: [50, 50] }])
    expect(paginateFlow(measurement, { first: 1000, rest: 1000 })).toEqual([
      [{ group: 0, from: 0, to: 1 }, { group: 1, from: 0, to: 2 }],
    ])
  })

  it('moves a whole unit to the next page instead of splitting it', () => {
    // header 100, section heading 20 + units 300, 300, 300 (with 4px gaps)
    const measurement = layout([{ heading: 0, units: [100], repeat: false }, { heading: 20, units: [300, 300, 300] }])
    const pages = paginateFlow(measurement, { first: 800, rest: 800 })
    expect(pages).toEqual([
      [{ group: 0, from: 0, to: 1 }, { group: 1, from: 0, to: 2 }],
      [{ group: 1, from: 2, to: 3 }],
    ])
  })

  it('reserves room for the repeated heading on continuation pages', () => {
    // Units of 390 on a 400px page: the continuation heading (20) forces one unit per page.
    const measurement = layout([{ heading: 20, units: [370, 390, 390] }], 10, 0)
    const pages = paginateFlow(measurement, { first: 400, rest: 400 })
    expect(pages).toEqual([
      [{ group: 0, from: 0, to: 1 }],
      [{ group: 0, from: 1, to: 2 }],
      [{ group: 0, from: 2, to: 3 }],
    ])
  })

  it('keeps a section heading with its first unit', () => {
    const measurement = layout([{ heading: 0, units: [700], repeat: false }, { heading: 30, units: [80] }], 10)
    // The heading alone would fit (700 + 10 + 30 = 740 < 780) but its first unit would not.
    const pages = paginateFlow(measurement, { first: 780, rest: 780 })
    expect(pages).toEqual([[{ group: 0, from: 0, to: 1 }], [{ group: 1, from: 0, to: 1 }]])
  })

  it('uses the continuation capacity after page one', () => {
    const measurement = layout([{ heading: 0, units: [200, 200, 200, 200], repeat: false }], 0, 0)
    const pages = paginateFlow(measurement, { first: 400, rest: 600 })
    expect(pages.map((page) => page.map((slice) => slice.to - slice.from))).toEqual([[2], [2]])
  })

  it('places a unit taller than a page alone rather than looping', () => {
    const measurement = layout([{ heading: 0, units: [50, 2000, 50], repeat: false }], 0, 0)
    const pages = paginateFlow(measurement, { first: 500, rest: 500 })
    expect(pages).toHaveLength(3)
    expect(pages[1]).toEqual([{ group: 0, from: 1, to: 2 }])
  })
})

describe('page helpers', () => {
  it('puts every non-empty group on a single fallback page', () => {
    expect(singlePage([1, 0, 3])).toEqual([[{ group: 0, from: 0, to: 1 }, { group: 2, from: 0, to: 3 }]])
  })

  it('counts pages across the main and side flows', () => {
    expect(combineFlows([[], []], [[], [], []]).count).toBe(3)
    expect(combineFlows([], []).count).toBe(1)
  })
})
