export const SITE_URL = 'https://resumes.byanr.com'
export const LAST_REVIEWED = '2026-08-31'

export const guidePages = [
  {
    path: '/guides/make-resume-pdf-online/',
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
            <p>The appearance controls include ten templates, A4 and Letter paper, title and body fonts, and an accent color. The preview uses the same saved draft as the editor, so changes appear without maintaining a second copy.</p>
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

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">Common questions</h2>
        <div class="questions">
          <div>
            <h3>Do I need to pay or create an account?</h3>
            <p>The current web app has no payment screen and does not require an account. This is a statement about the product as it works now, not a promise that its pricing can never change.</p>
          </div>
          <div>
            <h3>Does the website directly download a PDF?</h3>
            <p>No. On the website, the Download action opens the browser print dialog. Choose Save as PDF there. Direct PDF download and share are implemented in the Android and iOS apps.</p>
          </div>
          <div>
            <h3>Can I edit an existing resume PDF?</h3>
            <p>No. PDF editing and PDF import are not current features. The app can restore a Resume Maker 9000 JSON backup.</p>
          </div>
          <div>
            <h3>Does Resume Maker 9000 guarantee ATS compatibility?</h3>
            <p>No. The app does not include an ATS parser, score, or compatibility test. It gives you structured sections and templates, but it does not guarantee how a specific employer system will read the file.</p>
          </div>
        </div>
      </section>
    `,
  },
]
