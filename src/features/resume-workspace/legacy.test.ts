import { describe, expect, it } from 'vitest'

import { createResumeWorkspaceStore } from './store'
import { prepareLegacyResume } from './legacy'

describe('legacy resume route handoff', () => {
  it('creates an editable demo document when storage is empty', async () => {
    const workspace = createResumeWorkspaceStore({ persistence: null, autoHydrate: false })

    await prepareLegacyResume('demo', 'projects', workspace)

    const state = workspace.getState()
    expect(state.persistence.hydration).toBe('hydrated')
    expect(state.activeDocumentId).toBe('demo')
    expect(state.documents.demo.personalInfo.name).toBe('Maya Patel')
    expect(state.documents.demo.projects).toHaveLength(1)
    expect(state.currentStep).toBe('projects')
    expect(state.documents.demo.meta.step).toBe('projects')
  })

  it('migrates legacy step aliases and keeps hidden sections out of the workflow', async () => {
    const workspace = createResumeWorkspaceStore({ persistence: null, autoHydrate: false })
    const documentId = workspace.getState().actions.createDocument({ id: 'resume' })

    await prepareLegacyResume(documentId, 'personal_info', workspace)
    expect(workspace.getState().currentStep).toBe('personal-info')

    await prepareLegacyResume(documentId, 'languages', workspace)
    expect(workspace.getState().currentStep).toBe('personal-info')
    expect(workspace.getState().documents.resume.meta.step).toBe('personal-info')
  })

  it('imports an unindexed legacy profile even when a v1 workspace already exists', async () => {
    const workspace = createResumeWorkspaceStore({ persistence: null, autoHydrate: false })
    workspace.getState().actions.createDocument({ id: 'existing', name: 'Current resume' })
    const values = new Map([
      ['legacy-id', JSON.stringify({
        meta: { name: 'Legacy resume', step: 'experience' },
        personal_info: { name: 'Grace Hopper', email: 'grace@example.com' },
        experience: [{ company: 'Navy', title: 'Rear Admiral' }],
      })],
    ])

    await prepareLegacyResume('legacy-id', 'experience', workspace, {
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: () => undefined,
      },
    })

    const state = workspace.getState()
    expect(Object.keys(state.documents)).toEqual(['existing', 'legacy-id'])
    expect(state.activeDocumentId).toBe('legacy-id')
    expect(state.documents['legacy-id'].personalInfo.name).toBe('Grace Hopper')
    expect(state.currentStep).toBe('experience')
    expect(state.documents['legacy-id'].meta.step).toBe('experience')
  })
})
