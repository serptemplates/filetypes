import React from 'react';
import { Fingerprint } from 'lucide-react';

interface Magic {
  hex: string;
  offset?: number;
}

export default function SignaturesSection({ magic }: { magic?: Magic[] }) {
  if (!magic || magic.length === 0) return null;

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Fingerprint className="w-5 h-5 mr-2 text-blue-600" />
        Magic Bytes (Signatures)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Hex</th>
              <th className="py-2">Offset</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {magic.map((m, i) => (
              <tr key={i} className="border-t border-gray-200">
                <td className="py-2 pr-4 font-mono">{m.hex}</td>
                <td className="py-2">{typeof m.offset === 'number' ? m.offset : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

