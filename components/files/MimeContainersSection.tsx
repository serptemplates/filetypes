import React from 'react';
import { Tags } from 'lucide-react';

interface Props {
  mime?: string[];
  containers?: string[];
  related?: string[];
}

export default function MimeContainersSection({ mime, containers, related }: Props) {
  if ((!mime || mime.length === 0) && (!containers || containers.length === 0) && (!related || related.length === 0)) {
    return null;
  }

  const pill = (text: string) => (
    <span key={text} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
      {text}
    </span>
  );

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Tags className="w-5 h-5 mr-2 text-blue-600" />
        Properties
      </h3>
      <div className="space-y-3">
        {mime && mime.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-1">MIME Types</div>
            <div className="flex flex-wrap gap-2">{mime.map(m => pill(m))}</div>
          </div>
        )}
        {containers && containers.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-1">Containers</div>
            <div className="flex flex-wrap gap-2">{containers.map(c => pill(c))}</div>
          </div>
        )}
        {related && related.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-1">Related Formats</div>
            <div className="flex flex-wrap gap-2">{related.map(r => pill(r))}</div>
          </div>
        )}
      </div>
    </section>
  );
}

