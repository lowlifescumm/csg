"use client";
import { useMemo } from "react";

/**
 * MarkdownRenderer - Simple Markdown parser for reading outputs
 * 
 * Supports:
 * - **text** for bold
 * - Double newlines for paragraphs
 * - Single newlines preserved
 * 
 * Props:
 * - text: The markdown text to render
 * - className: Optional CSS classes
 */
export default function MarkdownRenderer({ text, className = "" }) {
  const rendered = useMemo(() => {
    if (!text) return null;

    // Split by double newlines to create paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((paragraph, pIndex) => {
      // Trim each paragraph
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      // Parse bold (**text**)
      const parts = [];
      let lastIndex = 0;
      const boldRegex = /\*\*(.+?)\*\*/g;
      let match;

      while ((match = boldRegex.exec(trimmed)) !== null) {
        // Add text before the bold
        if (match.index > lastIndex) {
          const beforeText = trimmed.substring(lastIndex, match.index);
          if (beforeText) {
            parts.push({ type: 'text', content: beforeText });
          }
        }

        // Add the bold text
        parts.push({ type: 'bold', content: match[1] });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text after last bold
      if (lastIndex < trimmed.length) {
        const afterText = trimmed.substring(lastIndex);
        if (afterText) {
          parts.push({ type: 'text', content: afterText });
        }
      }

      // If no bold found, just use the whole paragraph
      if (parts.length === 0) {
        parts.push({ type: 'text', content: trimmed });
      }

      // Replace single newlines with spaces (preserve within paragraphs)
      const processedParts = parts.map(part => ({
        ...part,
        content: part.content.replace(/\n/g, ' ')
      }));

      return (
        <p key={pIndex} className={`break-words whitespace-normal ${pIndex > 0 ? "mt-4" : ""}`}>
          {processedParts.map((part, i) => {
            if (part.type === 'bold') {
              return <strong key={i} className="font-semibold break-words">{part.content}</strong>;
            }
            return <span key={i} className="break-words">{part.content}</span>;
          })}
        </p>
      );
    }).filter(Boolean);
  }, [text]);

  if (!text) return null;

  return <div className={`${className} break-words w-full max-w-full whitespace-normal`}>{rendered}</div>;
}
