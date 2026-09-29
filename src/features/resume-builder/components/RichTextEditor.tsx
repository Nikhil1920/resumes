import * as React from "react"
import DOMPurify from "dompurify"
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  UnderlineIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "ul", "ol", "li", "a", "br", "p"]
const ALLOWED_ATTR = ["href", "target", "rel"]

export type RichTextEditorProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** The canonical HTML value. Only a small, safe formatting subset is retained. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Optional accessible name for the editable region. */
  "aria-label"?: string
  "aria-describedby"?: string
}

function sanitize(value: string) {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ["style", "class", "id"],
    ADD_ATTR: ["target", "rel"],
  })
}

type Format = "bold" | "italic" | "underline" | "insertUnorderedList"

/**
 * Small controlled rich-text field. The parent owns the HTML value; the DOM
 * ref is only an editing surface and is never treated as a second data store.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a short description…",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Rich text editor",
  "aria-describedby": ariaDescribedBy,
  id,
  ...props
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const selectionRef = React.useRef<Range | null>(null)

  React.useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const next = sanitize(value)
    // Avoid replacing the DOM while the user is typing; doing so would move
    // the caret and make a controlled field feel broken.
    if (editor.innerHTML !== next && document.activeElement !== editor) {
      editor.innerHTML = next
    }
  }, [value])

  const saveSelection = React.useCallback(() => {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection || !editor || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }, [])

  const restoreSelection = React.useCallback(() => {
    const editor = editorRef.current
    const range = selectionRef.current
    if (!editor || !range) return
    editor.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  const applyFormat = React.useCallback(
    (format: Format) => {
      restoreSelection()
      // The range is restored before this command, so toolbar focus does not
      // discard the user's selection. This is intentionally scoped to the
      // browser's editing surface and the resulting HTML is sanitized below.
      document.execCommand(format, false)
      const editor = editorRef.current
      if (editor) onChange(sanitize(editor.innerHTML))
      saveSelection()
    },
    [onChange, restoreSelection, saveSelection],
  )

  const applyLink = React.useCallback(() => {
    restoreSelection()
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) return

    const url = window.prompt("Enter a link URL")?.trim()
    if (!url) return
    document.execCommand("createLink", false, url)
    onChange(sanitize(editor.innerHTML))
    saveSelection()
  }, [onChange, restoreSelection, saveSelection])

  const handleInput = React.useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const safeHtml = sanitize(event.currentTarget.innerHTML)
      if (event.currentTarget.innerHTML !== safeHtml) {
        event.currentTarget.innerHTML = safeHtml
      }
      onChange(safeHtml)
      saveSelection()
    },
    [onChange, saveSelection],
  )

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault()
      const html = event.clipboardData.getData("text/html")
      const plainText = event.clipboardData.getData("text/plain")
      if (html) {
        document.execCommand("insertHTML", false, sanitize(html))
      } else {
        document.execCommand("insertText", false, plainText)
      }
      const editor = editorRef.current
      if (!editor) return
      const safeHtml = sanitize(editor.innerHTML)
      if (editor.innerHTML !== safeHtml) editor.innerHTML = safeHtml
      onChange(safeHtml)
      saveSelection()
    },
    [onChange, saveSelection],
  )

  const toolbarButton = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-9 sm:size-7"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault()
        saveSelection()
      }}
      onClick={onClick}
    >
      {icon}
    </Button>
  )

  return (
    <div
      {...props}
      className={cn("overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30", className)}
      data-disabled={disabled || undefined}
    >
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/40 p-1" role="toolbar" aria-label="Text formatting">
        {toolbarButton("Bold", <BoldIcon />, () => applyFormat("bold"))}
        {toolbarButton("Italic", <ItalicIcon />, () => applyFormat("italic"))}
        {toolbarButton("Underline", <UnderlineIcon />, () => applyFormat("underline"))}
        {toolbarButton("Bulleted list", <ListIcon />, () => applyFormat("insertUnorderedList"))}
        {toolbarButton("Add link", <LinkIcon />, applyLink)}
      </div>
      <div
        id={id}
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-multiline="true"
        aria-disabled={disabled || undefined}
        data-placeholder={placeholder}
        className="min-h-32 px-3 py-2.5 text-base leading-relaxed outline-none sm:text-sm empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_p]:mb-2 [&_ul]:list-disc"
        onInput={handleInput}
        onPaste={handlePaste}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
      />
    </div>
  )
}

export { sanitize as sanitizeRichText }
