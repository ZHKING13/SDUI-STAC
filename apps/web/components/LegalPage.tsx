import type { LegalPageContent } from '@famille/shared';

export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <article className="container prose">
      <h1 className="page-title">{content.title}</h1>
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
