import React from 'react';
import { Info } from 'lucide-react';
import Markdown from '@/components/common/Markdown';

interface WhatIsSectionProps {
  extension: string;
  whatIs: string;
}

export default function WhatIsSection({ extension, whatIs }: WhatIsSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Info className="w-5 h-5 mr-2 text-blue-600" />
        What is a .{extension} file?
      </h3>
      <Markdown content={whatIs} />
    </section>
  );
}
