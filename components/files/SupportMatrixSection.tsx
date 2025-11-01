import React from 'react';
import { Shield } from 'lucide-react';

type SupportState = 'yes' | 'no' | 'partial';

interface Support {
  browsers?: Record<string, SupportState>;
  oses?: Record<string, SupportState>;
  devices?: Record<string, SupportState>;
}

const Badge = ({ v }: { v: SupportState }) => {
  const cls = v === 'yes' ? 'bg-green-100 text-green-700 border-green-200'
    : v === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-red-100 text-red-700 border-red-200';
  return <span className={`px-2 py-0.5 text-xs rounded border ${cls}`}>{v}</span>;
};

function Table({ title, data }: { title: string; data?: Record<string, SupportState> }) {
  if (!data || Object.keys(data).length === 0) return null;
  const entries = Object.entries(data);
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
            <span className="text-sm text-gray-700 capitalize">{k.replace(/_/g, ' ')}</span>
            <Badge v={v} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupportMatrixSection({ support }: { support?: Support }) {
  if (!support || (!support.browsers && !support.oses && !support.devices)) return null;
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2 text-blue-600" />
        Support
      </h3>
      <div className="space-y-4">
        <Table title="Browsers" data={support.browsers} />
        <Table title="Operating Systems" data={support.oses} />
        <Table title="Devices" data={support.devices} />
      </div>
    </section>
  );
}

