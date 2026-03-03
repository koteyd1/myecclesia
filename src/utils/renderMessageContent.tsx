import React from 'react';

/**
 * Renders message content with basic Markdown support:
 * - **bold** text
 * - [link text](/path) or [link text](https://...)
 * - Line breaks preserved
 */
export const renderMessageContent = (content: string): React.ReactNode => {
  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);

  return paragraphs.map((paragraph, pIdx) => {
    // Split by single newlines within a paragraph
    const lines = paragraph.split('\n');

    return (
      <p key={pIdx} className={pIdx > 0 ? 'mt-3' : ''}>
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
};

function renderInline(text: string): React.ReactNode[] {
  // Match **bold**, [text](url), and 🔗 emoji bullet patterns
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      result.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3] && match[4]) {
      // [text](url)
      const isExternal = match[4].startsWith('http');
      result.push(
        <a
          key={match.index}
          href={match[4]}
          className="text-primary hover:text-primary/80 underline font-medium transition-colors"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {match[3]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}
