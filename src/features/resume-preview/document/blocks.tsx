import DOMPurify from 'dompurify'
import * as React from 'react'
import type { ReactNode } from 'react'
import { GlobeIcon, LinkIcon, MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react'

import { sanitizeRichText } from '../../resume-workspace/rich-text'
import type { PreviewLink, ResumePreviewModel } from '../index'
import type { TemplateDesign } from '../templates/catalog'
import { initials, type DocGroup, type EntryData, type SectionUnit } from './flows'

const sanitizeOptions = {
  ALLOWED_TAGS: ['a', 'b', 'br', 'em', 'i', 'li', 'ol', 'p', 'strong', 'u', 'ul'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  FORBID_ATTR: ['style', 'onerror', 'onclick'],
}

/** DOMPurify is used in the browser; the dependency-free boundary keeps SSR safe as well. */
function sanitizeHtml(html: string) {
  if (typeof DOMPurify.sanitize === 'function') return DOMPurify.sanitize(html, sanitizeOptions)
  return sanitizeRichText(html)
}

export function SafeHtml({ html, className }: { html?: string; className?: string }) {
  if (!html?.trim()) return null
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}

export function isSafeHref(value: string) {
  return /^(?:https?:|mailto:|tel:|\/|#)/i.test(value.trim())
}

/** Mirrors the workspace portrait allowlist so hand-built models cannot smuggle an unsafe src. */
function isSafePortraitSrc(value: string | undefined): value is string {
  if (!value) return false
  return /^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(value) || /^https?:\/\//i.test(value)
}

export function Portrait({ src }: { src?: string }) {
  if (!isSafePortraitSrc(src)) return null
  return <img className="rp-portrait" src={src} alt="" />
}

function LinkAnchor({ link, children }: { link: PreviewLink; children?: ReactNode }) {
  if (!isSafeHref(link.href)) return <span>{children ?? link.label}</span>
  return <a href={link.href} target="_blank" rel="noreferrer">{children ?? link.label}</a>
}

type ContactItem = { key: string; kind: 'email' | 'phone' | 'location' | 'link'; label: string; href?: string }

function contactItems(model: ResumePreviewModel): ContactItem[] {
  const { email, phone, location, links } = model.personalInfo
  const items: ContactItem[] = []
  if (email) items.push({ key: 'email', kind: 'email', label: email, href: `mailto:${email.trim()}` })
  if (phone) items.push({ key: 'phone', kind: 'phone', label: phone, href: `tel:${phone.replace(/[^\d+]/g, '')}` })
  if (location) items.push({ key: 'location', kind: 'location', label: location })
  for (const link of links) items.push({ key: link.id, kind: 'link', label: link.label, href: isSafeHref(link.href) ? link.href : undefined })
  return items
}

function ContactIcon({ item }: { item: ContactItem }) {
  const props = { 'aria-hidden': true, className: 'rp-contact__icon' } as const
  if (item.kind === 'email') return <MailIcon {...props} />
  if (item.kind === 'phone') return <PhoneIcon {...props} />
  if (item.kind === 'location') return <MapPinIcon {...props} />
  return /^https?:/i.test(item.href ?? '') && !/(linkedin|github|gitlab|scholar|orcid)/i.test(item.href ?? '') ? <GlobeIcon {...props} /> : <LinkIcon {...props} />
}

export function Contact({ model, design, className }: { model: ResumePreviewModel; design: TemplateDesign; className?: string }) {
  const items = contactItems(model)
  if (items.length === 0) return null
  return (
    <ul className={`rp-contact rp-contact--${design.contact}${className ? ` ${className}` : ''}`}>
      {items.map((item) => (
        <li key={item.key} className={`rp-contact__item rp-contact__item--${item.kind}`}>
          {design.contact === 'icons' ? <ContactIcon item={item} /> : null}
          {item.href ? (
            <a href={item.href} target={item.kind === 'link' ? '_blank' : undefined} rel={item.kind === 'link' ? 'noreferrer' : undefined}>{item.label}</a>
          ) : (
            <span>{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function Identity({ model }: { model: ResumePreviewModel }) {
  return (
    <div className="rp-identity">
      <h1 className="rp-name">{model.personalInfo.name || 'Your Name'}</h1>
      {model.personalInfo.headline ? <p className="rp-headline">{model.personalInfo.headline}</p> : null}
    </div>
  )
}

/** Page-one header for single-column templates and full-width headers of split templates. */
export function DocumentHeader({ model, design, unit }: { model: ResumePreviewModel; design: TemplateDesign; unit?: string }) {
  const showPortrait = design.portrait === 'header' && Boolean(model.personalInfo.image)
  return (
    <header
      className={`rp-header rp-header--${design.header}${showPortrait ? ' rp-header--with-portrait' : ''}${design.monogram ? ' rp-header--with-monogram' : ''}`}
      data-rp-unit={unit}
    >
      {showPortrait ? <Portrait src={model.personalInfo.image} /> : null}
      {design.monogram ? <div className="rp-monogram" aria-hidden="true">{initials(model.personalInfo.name) || 'CV'}</div> : null}
      <Identity model={model} />
      <Contact model={model} design={design} className="rp-header__contact" />
    </header>
  )
}

function SidebarIdentity({ model, design, unit }: { model: ResumePreviewModel; design: TemplateDesign; unit: string }) {
  return (
    <div className="rp-side-identity" data-rp-unit={unit}>
      {design.portrait === 'sidebar' ? <Portrait src={model.personalInfo.image} /> : null}
      <Identity model={model} />
    </div>
  )
}

function SidebarContact({ model, design, unit }: { model: ResumePreviewModel; design: TemplateDesign; unit: string }) {
  return (
    <div className="rp-side-contact" data-rp-unit={unit}>
      <Contact model={model} design={design} />
    </div>
  )
}

function EntryFooter({ entry, design }: { entry: EntryData; design: TemplateDesign }) {
  const tags = design.entry === 'classic' ? [] : entry.tags ?? []
  const links = entry.links ?? []
  if (tags.length === 0 && links.length === 0) return null
  return (
    <div className="rp-entry__footer">
      {tags.length > 0 ? (
        <ul className="rp-entry__tags">{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      ) : null}
      {links.length > 0 ? (
        <span className="rp-entry__links">{links.map((link) => <LinkAnchor link={link} key={link.id} />)}</span>
      ) : null}
    </div>
  )
}

function Entry({ entry, design }: { entry: EntryData; design: TemplateDesign }) {
  const className = `rp-entry rp-entry--${design.entry} rp-entry--${entry.kind}`
  const secondary = entry.secondary || entry.location ? (
    <p className="rp-entry__secondary">
      {entry.secondary ? <span className="rp-entry__org">{entry.secondary}</span> : null}
      {entry.location ? <span className="rp-entry__location">{entry.location}</span> : null}
    </p>
  ) : null

  if (design.entry === 'classic') {
    const orgLead = entry.orgLead
    const row1Right = entry.secondary ? (orgLead ? entry.location : entry.dates) : entry.dates ?? entry.location
    const row2Right = entry.secondary ? (orgLead ? entry.dates : entry.location) : undefined
    return (
      <article className={className}>
        <div className="rp-entry__row">
          <h3 className="rp-entry__primary">
            {entry.primary}
            {entry.tags?.length ? <span className="rp-entry__inline-tags"> | <em>{entry.tags.join(', ')}</em></span> : null}
          </h3>
          {row1Right ? <span className="rp-entry__meta">{row1Right}</span> : null}
        </div>
        {entry.secondary ? (
          <div className="rp-entry__row rp-entry__row--secondary">
            <p className="rp-entry__secondary">{entry.secondary}</p>
            {row2Right ? <span className="rp-entry__meta">{row2Right}</span> : null}
          </div>
        ) : null}
        <SafeHtml html={entry.html} className="rp-rich" />
        <EntryFooter entry={entry} design={design} />
      </article>
    )
  }

  if (design.entry === 'gutter') {
    return (
      <article className={className}>
        <p className="rp-entry__dates">
          {entry.dates?.split(' – ').map((part, index, parts) => (
            <React.Fragment key={index}>
              <span className="rp-entry__date-part">{part}{index < parts.length - 1 ? ' –' : ''}</span>
              {index < parts.length - 1 ? ' ' : null}
            </React.Fragment>
          ))}
        </p>
        <div className="rp-entry__body">
          <h3 className="rp-entry__primary">{entry.primary}</h3>
          {secondary}
          <SafeHtml html={entry.html} className="rp-rich" />
          <EntryFooter entry={entry} design={design} />
        </div>
      </article>
    )
  }

  return (
    <article className={className}>
      <div className="rp-entry__head">
        <div className="rp-entry__lead">
          <h3 className="rp-entry__primary">{entry.primary}</h3>
          {secondary}
        </div>
        {entry.dates ? <p className="rp-entry__dates">{entry.dates}</p> : null}
      </div>
      <SafeHtml html={entry.html} className="rp-rich" />
      <EntryFooter entry={entry} design={design} />
    </article>
  )
}

function SkillGroup({ unit, design }: { unit: Extract<SectionUnit, { type: 'skill-group' }>; design: TemplateDesign }) {
  const { group } = unit
  const name = group.name.trim()
  switch (design.skills) {
    case 'inline':
      return <p className="rp-skill rp-skill--inline">{name ? <strong>{name}: </strong> : null}{group.skills.join(', ')}</p>
    case 'tags':
      return (
        <div className="rp-skill rp-skill--tags">
          {name ? <h3 className="rp-skill__name">{name}</h3> : null}
          <ul className="rp-tags">{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
        </div>
      )
    case 'columns':
      return (
        <div className="rp-skill rp-skill--columns">
          {name ? <h3 className="rp-skill__name">{name}</h3> : null}
          <ul className="rp-skill__columns">{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
        </div>
      )
    default:
      return (
        <div className={`rp-skill rp-skill--grouped${name ? '' : ' rp-skill--unnamed'}`}>
          {name ? <h3 className="rp-skill__name">{name}</h3> : null}
          <p className="rp-skill__list">{group.skills.join(' · ')}</p>
        </div>
      )
  }
}

function Certification({ unit }: { unit: Extract<SectionUnit, { type: 'certification' }> }) {
  const { item } = unit
  const hasMeta = Boolean(item.date || (item.url && isSafeHref(item.url)))
  return (
    <div className="rp-cert">
      <p className="rp-cert__lead">
        <strong className="rp-cert__name">{item.name}</strong>
        {item.issuer ? <span className="rp-cert__issuer">{item.issuer}</span> : null}
      </p>
      {hasMeta ? (
        <p className="rp-cert__meta">
          {item.date ? <span>{item.date}</span> : null}
          {item.url && isSafeHref(item.url) ? <a href={item.url} target="_blank" rel="noreferrer">Credential</a> : null}
        </p>
      ) : null}
    </div>
  )
}

function Languages({ unit }: { unit: Extract<SectionUnit, { type: 'languages' }> }) {
  return (
    <ul className="rp-langs">
      {unit.items.map((item) => (
        <li key={item.id}>
          <strong>{item.name}</strong>
          {item.proficiency ? <span>{item.proficiency}</span> : null}
        </li>
      ))}
    </ul>
  )
}

function Unit({ unit, design, unitKey }: { unit: SectionUnit; design: TemplateDesign; unitKey: string }) {
  let content: ReactNode
  switch (unit.type) {
    case 'rich':
      content = <SafeHtml html={unit.html} className="rp-rich" />
      break
    case 'entry':
      content = <Entry entry={unit.entry} design={design} />
      break
    case 'skill-group':
      content = <SkillGroup unit={unit} design={design} />
      break
    case 'certification':
      content = <Certification unit={unit} />
      break
    case 'languages':
      content = <Languages unit={unit} />
      break
  }
  return <div className={`rp-unit rp-unit--${unit.type}`} data-rp-unit={unitKey}>{content}</div>
}

export interface GroupSlice {
  group: DocGroup
  index: number
  from: number
  to: number
}

export function GroupBlock({ slice, model, design }: { slice: GroupSlice; model: ResumePreviewModel; design: TemplateDesign }) {
  const { group, index, from, to } = slice
  const unitKey = (item: number) => `${index}:${item}`
  if (group.kind === 'header') {
    return <div className="rp-group rp-group--header" data-rp-group={index}><DocumentHeader model={model} design={design} unit={unitKey(0)} /></div>
  }
  if (group.kind === 'identity') {
    return <div className="rp-group rp-group--identity" data-rp-group={index}><SidebarIdentity model={model} design={design} unit={unitKey(0)} /></div>
  }
  if (group.kind === 'contact') {
    return <div className="rp-group rp-group--contact" data-rp-group={index}><SidebarContact model={model} design={design} unit={unitKey(0)} /></div>
  }
  const continued = from > 0
  const units = group.units.slice(from, to)
  return (
    <section className={`rp-group rp-section rp-section--${group.section.type}${continued ? ' rp-section--continued' : ''}`} data-rp-group={index}>
      <h2 className="rp-section__title">
        <span className="rp-section__label">{group.title}</span>
        {continued ? <span className="rp-section__continued">continued</span> : null}
      </h2>
      <div className="rp-section__items">
        {units.map((unit, offset) => <Unit key={unit.id} unit={unit} design={design} unitKey={unitKey(from + offset)} />)}
      </div>
    </section>
  )
}

export function RunningHeader({ model }: { model: ResumePreviewModel }) {
  return (
    <div className="rp-running" aria-hidden="true">
      <span className="rp-running__name">{model.personalInfo.name || 'Resume'}</span>
      {model.personalInfo.headline ? <span className="rp-running__headline">{model.personalInfo.headline}</span> : null}
    </div>
  )
}
