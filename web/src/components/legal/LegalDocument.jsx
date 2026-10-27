function renderListItem(item, index) {
  if (typeof item === 'string') {
    return <li key={index}>{item}</li>;
  }

  if (item?.href) {
    return (
      <li key={index}>
        <a href={item.href}>{item.label}</a>
      </li>
    );
  }

  return <li key={index}>{item?.label ?? String(item)}</li>;
}

function renderLinkList(links) {
  return (
    <ul className="legal-document-links">
      {links.map((link, index) => (
        <li key={link.href ?? index}>
          <a href={link.href} rel="noopener noreferrer" target="_blank">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function LegalDocument({ document }) {
  const { title, lastUpdated, sections } = document;

  return (
    <article className="legal-document">
      <header className="static-page-intro">
        <h1>{title}</h1>
        <p className="legal-document-updated">Last updated: {lastUpdated}</p>
      </header>

      {sections.map((section) => (
        <section key={section.heading} className="legal-document-section">
          <h2>{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list ? <ul>{section.list.map(renderListItem)}</ul> : null}
          {section.links ? renderLinkList(section.links) : null}
        </section>
      ))}
    </article>
  );
}
