interface NarrativeProps {
  text: string;
  sourceUrl?: string | null;
}

// Renders a long-form narrative (Wikipedia intro extract) as paragraphs,
// with source attribution. Plain-text extracts separate paragraphs with newlines.
export function Narrative({ text, sourceUrl }: NarrativeProps) {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section>
      <div className="space-y-4 text-[15px] leading-relaxed text-neutral-300">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {sourceUrl && (
        <p className="mt-4 font-sans-ui text-xs text-neutral-500">
          Relato:{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-khaki hover:underline">
            Wikipedia en español
          </a>{' '}
          · CC BY-SA
        </p>
      )}
    </section>
  );
}
