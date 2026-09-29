/**
 * Pure pagination for resume flows.
 *
 * A document is made of one or two flows (the main column and, for sidebar
 * templates, the side column).  Each flow is an ordered list of groups
 * (the header, then one group per section), and each group is a list of
 * units that must not be split across pages (an experience entry, a skill
 * group, a paragraph).  The renderer measures every unit once in a
 * continuous, unpaginated layout; this module decides where page breaks go.
 */

export interface MeasuredGroup {
  /** Top of the group (including its heading) relative to the flow's content top. */
  top: number
  /** Space the heading takes above the first unit, including the gap below it. */
  headingHeight: number
  /** Sections repeat their heading when they continue on a new page. */
  repeatHeading: boolean
}

export interface MeasuredUnit {
  group: number
  item: number
  top: number
  bottom: number
}

export interface FlowMeasurement {
  groups: MeasuredGroup[]
  /** Units in reading order. */
  units: MeasuredUnit[]
}

export interface FlowCapacity {
  /** Usable flow height on page one. */
  first: number
  /** Usable flow height on continuation pages. */
  rest: number
}

/** A contiguous run of units from one group that lands on a page. */
export interface FlowSlice {
  group: number
  from: number
  /** Exclusive end index. */
  to: number
}

export type FlowPages = FlowSlice[][]

/** Sub-pixel rounding differs between measurement and final layout. */
const TOLERANCE = 1.5

/**
 * Greedy, keep-together pagination: fill each page with whole units; move a
 * unit to the next page when it does not fit; the first unit of a group
 * always travels with the group's heading.  A unit taller than a whole page
 * is placed alone and allowed to overflow rather than looping forever.
 */
export function paginateFlow(measurement: FlowMeasurement, capacity: FlowCapacity): FlowPages {
  const pages: FlowPages = []
  let current: FlowSlice[] = []
  let pageStart = 0
  let reserved = 0
  let limit = capacity.first

  const startPage = (unitStart: number, unit: MeasuredUnit) => {
    pageStart = unitStart
    const group = measurement.groups[unit.group]
    reserved = unit.item > 0 && group?.repeatHeading ? group.headingHeight : 0
  }

  for (const unit of measurement.units) {
    const group = measurement.groups[unit.group]
    const unitStart = unit.item === 0 && group ? Math.min(group.top, unit.top) : unit.top
    if (current.length === 0) startPage(unitStart, unit)

    const used = unit.bottom - pageStart + reserved
    if (used > limit + TOLERANCE && current.length > 0) {
      pages.push(current)
      current = []
      limit = capacity.rest
      startPage(unitStart, unit)
    }

    const last = current[current.length - 1]
    if (last && last.group === unit.group && last.to === unit.item) {
      last.to = unit.item + 1
    } else {
      current.push({ group: unit.group, from: unit.item, to: unit.item + 1 })
    }
  }

  if (current.length > 0) pages.push(current)
  return pages
}

/** Put every unit on one page; used before measurement and in non-DOM environments. */
export function singlePage(groupSizes: readonly number[]): FlowPages {
  return [groupSizes.map((size, group) => ({ group, from: 0, to: size })).filter((slice) => slice.to > 0)]
}

export interface DocumentPages {
  main: FlowPages
  side: FlowPages
  count: number
}

export function combineFlows(main: FlowPages, side: FlowPages): DocumentPages {
  return { main, side, count: Math.max(1, main.length, side.length) }
}

export const samePages = (left: DocumentPages | null, right: DocumentPages | null) =>
  JSON.stringify(left) === JSON.stringify(right)
