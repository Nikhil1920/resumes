import { RESUME_TEMPLATE_IDS, TEMPLATE_COUNT } from './templates.mjs'

export const SITE_URL = 'https://resumes.byanr.com'
export const REPO_URL = 'https://github.com/Nikhil1920/resumes'
export const WEBMCP_SOURCE_URL = `${REPO_URL}/blob/main/src/features/webmcp/tools.ts`
export const LAST_REVIEWED = '2026-09-29'

export const AUTHOR = {
  name: 'Nikhil Reddy Avuthu',
  url: 'https://github.com/Nikhil1920',
}

/** The WebMCP tools an agent can call. Mirrors src/features/webmcp/tools.ts. */
export const webmcpTools = [
  ['get-workspace', 'List saved resumes, their progress, and where the user is in the app.'],
  ['get-resume', 'Read one resume in full: personal info, every section, and settings.'],
  ['create-resume', 'Create a new resume, select it, and open the editor.'],
  ['update-personal-info', 'Set the name, email, phone, headline, and profile links.'],
  ['update-summary', 'Write or replace the professional summary.'],
  ['add-section-entry', 'Add a job, degree, project, skill, certification, or language.'],
  ['update-section-entry', 'Edit any field of an existing entry.'],
  ['delete-section-entry', 'Remove one entry.'],
  ['update-awards', 'Write or replace the awards content.'],
  ['set-section-visibility', 'Show, hide, or restore a resume section.'],
  ['recommend-templates', 'Rank templates for a job title, industry, region, and ATS needs, with reasons.'],
  ['list-templates', 'Describe every template: best-fit roles, ATS rating, layout, pages, and photo support.'],
  ['open-template-explorer', 'Open the visual template explorer, optionally to restyle a resume.'],
  ['set-appearance', 'Switch template, page size, fonts, and accent color.'],
  ['set-builder-step', 'Move the editor to a specific section.'],
  ['open-preview', 'Open the full-page print preview.'],
  ['export-pdf', 'Open the preview and start the Save-as-PDF flow for the user to confirm.'],
  ['export-resume', 'Return the resume as portable JSON.'],
  ['delete-resume', 'Delete a resume the agent no longer needs.'],
  ['go-to-dashboard', 'Return to the resume list.'],
]

const escape = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const toolTable = `
        <div class="table-wrap">
          <table>
            <thead><tr><th scope="col">Tool</th><th scope="col">What the agent can do</th></tr></thead>
            <tbody>
${webmcpTools.map(([name, purpose]) => `              <tr><td><code>${name}</code></td><td>${escape(purpose)}</td></tr>`).join('\n')}
            </tbody>
          </table>
        </div>`

/**
 * Static, crawlable guides. Each page is rendered to plain HTML at build time
 * by scripts/prepare-build.mjs. `faqs` feed both the visible FAQ section and
 * the FAQPage structured data, so the two can never drift apart.
 */
export const guidePages = [
  {
    path: '/guides/make-resume-pdf-online/',
    marker: 'resume-pdf-guide',
    breadcrumb: 'PDF guide',
    reviewed: '2026-08-31',
    title: 'How to Make a Resume PDF Online',
    description:
      'Use Resume Maker 9000 to build a resume without an account, preview it, and save it as a PDF through your browser print dialog.',
    eyebrow: 'PDF resume guide',
    heading: 'How to make a resume PDF online',
    introduction:
      'Resume Maker 9000 stores drafts in your browser by default. You can start with a blank document or a fictional sample, edit the included resume sections, choose a template, and save the preview as a PDF through your browser print dialog.',
    body: `
      <aside class="answer" aria-labelledby="quick-answer-heading">
        <h2 id="quick-answer-heading">The short version</h2>
        <p>Open the resume maker, create a draft, fill in the sections you need, and check the preview. Select <strong>Download</strong> on the website to open the browser print dialog, then choose <strong>Save as PDF</strong> or the equivalent option in your browser.</p>
      </aside>

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading">Make the resume and save the PDF</h2>
        <ol class="steps">
          <li>
            <h3>Start a draft</h3>
            <p>Open <a href="/">Resume Maker 9000</a> and choose <strong>Create a resume</strong>. If you want to inspect a completed draft first, choose <strong>Start with a sample</strong>. The sample uses a fictional person and fictional work history.</p>
          </li>
          <li>
            <h3>Add the sections that fit your experience</h3>
            <p>The editor supports a profile summary, experience, education, projects, skills, certifications, awards, and languages. You can rename, reorder, show, or hide the built-in sections. Leave out sections that do not help the reader understand your background.</p>
          </li>
          <li>
            <h3>Choose the page and template</h3>
            <p>The appearance controls include ${TEMPLATE_COUNT} templates for different jobs, from plain ATS-first layouts to executive and academic CVs that flow across several pages, plus A4 and Letter paper, title and body fonts, and an accent color. The <a href="/templates">template explorer</a> previews each one with sample content for the roles it suits. The preview uses the same saved draft as the editor, so changes appear without maintaining a second copy.</p>
          </li>
          <li>
            <h3>Check the preview</h3>
            <p>Read the resume once for missing dates, unfinished rows, and links that point to the wrong place. A template cannot decide whether the wording is accurate, and this app does not score or test a resume against applicant tracking systems.</p>
          </li>
          <li>
            <h3>Save the browser output as a PDF</h3>
            <p>Select <strong>Download</strong> in the website preview. The website calls the browser print command. In the destination or printer menu, choose <strong>Save as PDF</strong>, confirm the paper size, and save the file. Android and iOS builds use a native PDF download action instead.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="storage-heading">
        <h2 id="storage-heading">What “without signing up” means here</h2>
        <p>The current app has no account or payment flow. It saves resume drafts in local browser storage by default. That makes it quick to return to a draft on the same browser, but it is not cloud sync. Opening the same URL on another device will not move the resume data there.</p>
        <p>Browser storage can be cleared. Use <strong>Export JSON</strong> when you want a backup that you can keep elsewhere, then use <strong>Import JSON</strong> to restore that backup in Resume Maker 9000.</p>
      </section>

      <section class="limits" aria-labelledby="limits-heading">
        <h2 id="limits-heading">What the importer does not do</h2>
        <p>Resume Maker 9000 imports its own JSON backup format and compatible legacy resume data. It does not import or edit PDF or DOCX files. If your only copy is a PDF, you must enter that content into a new draft.</p>
      </section>

      <section aria-labelledby="agents-heading">
        <h2 id="agents-heading">Prefer to have an AI agent do the typing?</h2>
        <p>The same workflow is exposed to AI agents through WebMCP. An agent can create the draft, fill every section, pick a template, and open the preview for you to save. See <a href="/guides/ai-resume-builder-webmcp/">how AI agents build resumes with WebMCP</a>.</p>
      </section>
    `,
    faqs: [
      ['Do I need to pay or create an account?', 'The current web app has no payment screen and does not require an account. This is a statement about the product as it works now, not a promise that its pricing can never change.'],
      ['Does the website directly download a PDF?', 'No. On the website, the Download action opens the browser print dialog. Choose Save as PDF there. Direct PDF download and share are implemented in the Android and iOS apps.'],
      ['Can I edit an existing resume PDF?', 'No. PDF editing and PDF import are not current features. The app can restore a Resume Maker 9000 JSON backup.'],
      ['Does Resume Maker 9000 guarantee ATS compatibility?', 'No. The app does not include an ATS parser, score, or compatibility test. It gives you structured sections and templates, but it does not guarantee how a specific employer system will read the file.'],
    ],
  },
  {
    path: '/guides/ai-resume-builder-webmcp/',
    marker: 'webmcp-guide',
    breadcrumb: 'AI agents',
    reviewed: '2026-09-29',
    title: 'AI Resume Builder for Agents: WebMCP Tools',
    description:
      'Resume Maker 9000 exposes its whole resume workflow as WebMCP tools, so an AI agent can autonomously create, tailor, style, and preview resumes in your browser.',
    eyebrow: 'AI agents · WebMCP',
    heading: 'Let an AI agent build your resume with WebMCP',
    introduction:
      'Resume Maker 9000 publishes its editor as a set of WebMCP tools. An AI agent working in your browser can create a resume, fill in every section, tailor it to a job description, switch templates, and open the print-ready preview, all without screen scraping and all visible in the live editor.',
    body: `
      <aside class="answer" aria-labelledby="quick-answer-heading">
        <h2 id="quick-answer-heading">The short version</h2>
        <p>WebMCP lets a web page tell AI agents which actions it supports. Resume Maker 9000 registers ${webmcpTools.length} tools that cover the full create, edit, style, and export workflow. An agent that supports WebMCP can call them directly, so it can build a new tailored resume for each application on its own. You stay in control: everything happens in your browser, every change shows up in the editor with undo, and saving the PDF still needs your confirmation.</p>
      </aside>

      <section aria-labelledby="what-heading">
        <h2 id="what-heading">What WebMCP is</h2>
        <p><a href="https://webmachinelearning.github.io/webmcp/" rel="noopener">WebMCP</a> is a proposed web standard from the W3C Web Machine Learning community group, with an early implementation in Chrome. A page registers named tools with typed inputs through <code>document.modelContext</code>. Agents in the browser discover those tools and call them like function calls, instead of guessing where to click.</p>
        <p>For a resume builder, the difference is reliability. The agent does not need to find the Add experience button or wait for a form to render. It calls <code>add-section-entry</code> with a company, title, dates, and bullet points, and the app validates the input and returns a clear error if something is wrong.</p>
      </section>

      <section aria-labelledby="flow-heading">
        <h2 id="flow-heading">What an autonomous agent session looks like</h2>
        <ol class="steps">
          <li>
            <h3>The agent reads the workspace</h3>
            <p><code>get-workspace</code> returns the saved resumes and their completion. The agent can start from an existing resume with <code>get-resume</code> or create a new one.</p>
          </li>
          <li>
            <h3>It creates a version for the job</h3>
            <p><code>create-resume</code> opens a fresh draft named for the role, such as “Backend Engineer, Acme”. Keeping one version per application is the normal way to use the app.</p>
          </li>
          <li>
            <h3>It writes the content</h3>
            <p><code>update-personal-info</code>, <code>update-summary</code>, and <code>add-section-entry</code> fill in contact details, a summary tuned to the job description, work history, projects, and skills. Each call renders immediately in the editor.</p>
          </li>
          <li>
            <h3>It styles the page</h3>
            <p><code>recommend-templates</code> ranks the ${TEMPLATE_COUNT} templates for the target job and explains why; <code>set-appearance</code> applies the choice with its designed fonts and accent color, or sets A4 or Letter paper. <code>set-section-visibility</code> hides sections that do not help this application.</p>
          </li>
          <li>
            <h3>You review and save the PDF</h3>
            <p><code>export-pdf</code> opens the preview and the browser print dialog. You check the result and choose Save as PDF. On the Android and iOS apps the PDF downloads directly.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="tools-heading">
        <h2 id="tools-heading">The full tool catalog</h2>
        <p>Every tool accepts an optional <code>resumeId</code> and otherwise acts on the resume that is open. Tools use the same actions as the buttons in the interface, so agent edits autosave, appear in undo history, and look exactly like edits you make yourself.</p>
${toolTable}
      </section>

      <section aria-labelledby="fields-heading">
        <h2 id="fields-heading">Field reference for resume sections</h2>
        <p><code>add-section-entry</code> and <code>update-section-entry</code> take a <code>section</code> name and an entry object. Dates are display strings such as <code>Aug 2021</code>, <code>2020</code>, or <code>Present</code>. Descriptions accept plain text or simple HTML (paragraphs, lists, bold, italic, and links); anything else is removed.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th scope="col">Section</th><th scope="col">Required</th><th scope="col">Optional</th></tr></thead>
            <tbody>
              <tr><td><code>experience</code></td><td>company, title</td><td>location, startDate, endDate, description</td></tr>
              <tr><td><code>education</code></td><td>institution</td><td>degree, location, startDate, endDate, description</td></tr>
              <tr><td><code>projects</code></td><td>title</td><td>description, skills (list), startDate, endDate, links (title and url)</td></tr>
              <tr><td><code>skills</code></td><td>name</td><td>category</td></tr>
              <tr><td><code>certifications</code></td><td>name</td><td>issuer, date, url</td></tr>
              <tr><td><code>languages</code></td><td>name</td><td>proficiency: Basic, Conversational, Proficient, or Fluent</td></tr>
            </tbody>
          </table>
        </div>
        <p><code>set-appearance</code> accepts the templates ${RESUME_TEMPLATE_IDS.map((id) => `<code>${id}</code>`).join(', ')}, the page sizes <code>A4</code> and <code>Letter</code>, and a hex accent color such as <code>#004aad</code>. Call <code>list-templates</code> for each template's best-fit roles, ATS rating, layout, and page guidance.</p>
        <p>When an input is invalid, a tool returns a result whose text starts with <code>Error:</code> and lists the accepted values, so the agent can correct the call and retry. The tool definitions and validation live in <a href="${WEBMCP_SOURCE_URL}" rel="noopener">src/features/webmcp/tools.ts on GitHub</a>.</p>
      </section>

      <section aria-labelledby="try-heading">
        <h2 id="try-heading">How to try it</h2>
        <p>In Chrome, enable <code>chrome://flags/#enable-webmcp-testing</code>, reload <a href="/">Resume Maker 9000</a>, and use an agent or the Model Context Tool Inspector extension to list and call the tools. In browsers without native WebMCP, the app installs a compatible <code>document.modelContext</code> itself, so automation harnesses that can run JavaScript in the page can call the same tools.</p>
        <pre><code>agent-browser open ${SITE_URL}/
agent-browser webmcp list
agent-browser webmcp invoke create-resume --params '{"name":"Backend Engineer, Acme"}'
agent-browser webmcp invoke add-section-entry --params '{"section":"skills","entry":{"name":"Go","category":"Languages"}}'
agent-browser webmcp invoke export-pdf --params '{}'</code></pre>
      </section>

      <section class="limits" aria-labelledby="limits-heading">
        <h2 id="limits-heading">What to know before you hand it to an agent</h2>
        <p>Resume Maker 9000 does not include its own language model. The agent you bring writes the content, and you are responsible for checking that it is accurate. Native WebMCP is still experimental in browsers, and the final Save as PDF step on the website needs a person to confirm the print dialog. The app does not score resumes or guarantee how applicant tracking systems read them.</p>
      </section>
    `,
    faqs: [
      ['Can an AI agent build a resume by itself in Resume Maker 9000?', 'Yes. Through WebMCP, an agent can create a resume, fill every section, choose a template, and open the preview without a person clicking through the editor. The last Save as PDF step in the browser print dialog needs a person to confirm it.'],
      ['Which AI agents work with it?', 'Any agent that can call WebMCP tools in the page, such as agents in a Chrome build with WebMCP enabled or browser automation tools like agent-browser. Harnesses that can run JavaScript in the page can use the built-in fallback model context.'],
      ['Does my resume data leave my browser?', 'The app itself stores resumes in local browser storage and does not upload them. An AI agent you connect may send content to its own model provider, so check that agent’s privacy terms.'],
      ['Can an agent tailor a different resume for each job?', 'Yes. An agent can read an existing resume, create a new version named for the role, and rewrite the summary, bullet points, skills, and section order for that job description.'],
      ['Is WebMCP the same as MCP?', 'They are related. The Model Context Protocol connects agents to tools on servers. WebMCP brings the same tool idea to web pages, so a site can expose tools directly to agents in the browser.'],
    ],
  },
  {
    path: '/guides/open-source-resume-builder/',
    marker: 'open-source-guide',
    breadcrumb: 'Open source',
    reviewed: '2026-09-29',
    title: 'Open-Source Resume Builder (AGPL-3.0)',
    description:
      'Resume Maker 9000 is an open-source resume builder licensed under AGPL-3.0. Read the code, run it locally, self-host it, or contribute on GitHub.',
    eyebrow: 'Open source',
    heading: 'An open-source resume builder you can read, run, and self-host',
    introduction:
      'The complete source code of Resume Maker 9000, including the web app, the Android and iOS shells, the templates, and the WebMCP tools, is public on GitHub under the GNU Affero General Public License v3.0.',
    body: `
      <aside class="answer" aria-labelledby="quick-answer-heading">
        <h2 id="quick-answer-heading">The short version</h2>
        <p>The repository is <a href="${REPO_URL}" rel="noopener">github.com/Nikhil1920/resumes</a>. You can use the hosted app for free, run it on your own machine with a few commands, deploy your own copy, or send improvements back as pull requests.</p>
      </aside>

      <section aria-labelledby="why-heading">
        <h2 id="why-heading">Why open source matters for a resume tool</h2>
        <p>A resume holds your contact details and your work history. With the source public, anyone can check that the app keeps drafts in local browser storage, that it has no account system, and that it does not upload your resume anywhere. You do not have to take the privacy claims on trust.</p>
        <p>It also means the app cannot hold your data hostage. The JSON export format is documented in the code, so your resumes stay portable even if you stop using the hosted site.</p>
      </section>

      <section aria-labelledby="stack-heading">
        <h2 id="stack-heading">What is in the repository</h2>
        <ul class="checks">
          <li>A React 19 and TanStack Start web app with Tailwind CSS and shadcn/ui components.</li>
          <li>A single Zustand workspace store shared by the dashboard, editor, preview, and AI tools.</li>
          <li>${TEMPLATE_COUNT} print-ready resume templates rendered from the same data model, with real multi-page pagination.</li>
          <li>Capacitor projects for the Android and iOS apps, with native PDF download and share.</li>
          <li>The <a href="/guides/ai-resume-builder-webmcp/">WebMCP tool catalog</a> that lets AI agents drive the app.</li>
          <li>Vitest tests for the workspace model, preview adapter, and agent tools.</li>
        </ul>
      </section>

      <section aria-labelledby="run-heading">
        <h2 id="run-heading">Run it locally</h2>
        <p>You need Node.js and pnpm. Clone the repository, install dependencies, and start the dev server:</p>
        <pre><code>git clone ${REPO_URL}.git
cd resumes
pnpm install
pnpm dev</code></pre>
        <p><code>pnpm build</code> produces the web build, and <code>pnpm build:capacitor</code> produces the bundle used by the native apps. The README lists the other scripts, including type checking, tests, and SEO verification.</p>
      </section>

      <section aria-labelledby="license-heading">
        <h2 id="license-heading">What the AGPL-3.0 license means</h2>
        <p>You are free to use, study, modify, and share the code. If you distribute a modified version, or run one as a service that other people use over a network, you must make your modified source available to those users under the same license. The full terms are in the <a href="${REPO_URL}/blob/main/LICENSE" rel="noopener">LICENSE file</a>. This page is a plain-language summary, not legal advice.</p>
      </section>

      <section aria-labelledby="contribute-heading">
        <h2 id="contribute-heading">Contribute</h2>
        <p>Bug reports, template ideas, accessibility fixes, and translations are welcome. Open an issue on <a href="${REPO_URL}/issues" rel="noopener">GitHub Issues</a> to discuss a change, or send a pull request against the <code>main</code> branch.</p>
      </section>
    `,
    faqs: [
      ['Is Resume Maker 9000 open source?', 'Yes. The full source code is available at github.com/Nikhil1920/resumes under the GNU Affero General Public License v3.0.'],
      ['Can I self-host Resume Maker 9000?', 'Yes. Build the web app with pnpm build and serve the output from any static host that supports SPA fallbacks. The AGPL requires you to share your source if you modify it and let others use your copy over a network.'],
      ['Is the hosted version free?', 'The hosted web app currently has no payment screen and does not require an account. The code is free to use under the AGPL-3.0 license.'],
      ['How can I contribute?', 'Open an issue or pull request on GitHub. Template, accessibility, and bug-fix contributions are all welcome.'],
    ],
  },
]

export const guidesIndex = {
  path: '/guides/',
  title: 'Resume Maker 9000 Guides',
  description:
    'Guides for Resume Maker 9000: save a resume as a PDF, let AI agents build resumes with WebMCP, and run the open-source code yourself.',
  heading: 'Guides',
  introduction:
    'Short, accurate guides to what Resume Maker 9000 does today, written against the current product.',
}
