import {
  BUILT_IN_SECTION_IDS,
  type BuiltInSectionId,
  type ResumeStep,
} from './model'
import { createDemoResumePayload } from './demo'
import {
  readLegacyDocument,
  readLegacyDocumentFromBrowser,
  type StorageLike,
} from './persistence'
import { resumeWorkspaceStore, type ResumeWorkspaceStore } from './store'

const LEGACY_DEMO_ID = 'demo'

const isBuiltInSectionId = (value: string): value is BuiltInSectionId =>
  (BUILT_IN_SECTION_IDS as readonly string[]).includes(value)

const normalizeLegacyStep = (value: string): ResumeStep => {
  if (value === 'personal_info' || value === 'personalInfo') return 'personal-info'
  return value === 'personal-info' || isBuiltInSectionId(value)
    ? value
    : 'personal-info'
}

export interface PrepareLegacyResumeOptions {
  /** Injected storage seam for tests and non-browser hosts. */
  storage?: StorageLike | null
}

/**
 * Resolve a legacy profile URL into the canonical Zustand workspace before
 * redirecting to the React builder or preview. Hydration must complete first;
 * otherwise a fresh `/create-resume/demo` navigation could race the persisted
 * workspace read and either lose the demo or overwrite an existing document.
 */
export async function prepareLegacyResume(
  documentId: string,
  requestedStep?: string,
  workspace: ResumeWorkspaceStore = resumeWorkspaceStore,
  options: PrepareLegacyResumeOptions = {},
) {
  await workspace.getState().actions.hydrate()

  let state = workspace.getState()
  if (documentId === LEGACY_DEMO_ID && !state.documents[documentId]) {
    workspace.getState().actions.importDocument(
      createDemoResumePayload(documentId),
      { select: true },
    )
    state = workspace.getState()
  }

  if (!state.documents[documentId]) {
    const legacyDocument = options.storage === undefined
      ? readLegacyDocumentFromBrowser(documentId)
      : options.storage
        ? readLegacyDocument(options.storage, documentId)
        : null
    if (legacyDocument) {
      workspace.getState().actions.importDocument(legacyDocument, { select: true })
      state = workspace.getState()
    }
  }

  if (state.documents[documentId]) {
    state.actions.selectDocument(documentId)
    if (requestedStep !== undefined) {
      state.actions.setCurrentStep(normalizeLegacyStep(requestedStep))
    }
  }

  return documentId
}
