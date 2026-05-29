type MarkdownDocumentProps = {
  value: string;
};

function renderLine(line: string, index: number) {
  if (line.startsWith("# ")) {
    return (
      <h1
        key={index}
        className="mb-3 border-b border-[#d0d7de] pb-2 text-2xl font-semibold"
      >
        {line.slice(2)}
      </h1>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <h2
        key={index}
        className="mb-2 mt-4 border-b border-[#d0d7de] pb-1 text-xl font-semibold"
      >
        {line.slice(3)}
      </h2>
    );
  }

  if (line.startsWith("- ")) {
    return (
      <li key={index} className="ml-5 list-disc text-sm leading-6">
        {line.slice(2)}
      </li>
    );
  }

  if (!line.trim()) {
    return <div key={index} className="h-2" />;
  }

  return (
    <p key={index} className="text-sm leading-6 text-[#24292f]">
      {line}
    </p>
  );
}

export function MarkdownDocument({ value }: MarkdownDocumentProps) {
  return (
    <div className="grid gap-1 rounded-md border border-[#d0d7de] bg-white p-4">
      {value.split(/\r?\n/).map(renderLine)}
    </div>
  );
}
