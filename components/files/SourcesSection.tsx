import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { toIsoUtcZ } from '@/lib/dates';

interface SourceRef {
  url: string;
  retrieved_at?: string;
}

export default function SourcesSection({ sources }: { sources?: SourceRef[] }) {
  const list = (sources || []).filter(s => s && s.url);
  if (list.length === 0) return null;

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
        Sources
      </h3>
      <ul className="space-y-2 text-sm">
        {list.map((s, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <a href={s.url} className="text-blue-600 hover:text-blue-700 break-all" target="_blank" rel="noopener noreferrer">
              {s.url}
            </a>
            {s.retrieved_at && (
              <span className="text-gray-500 ml-3">{toIsoUtcZ(s.retrieved_at) || s.retrieved_at}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

