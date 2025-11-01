import React from 'react';
import { FileText } from 'lucide-react';
import Markdown from '@/components/common/Markdown';

interface TechnicalInfoSectionProps {
  moreInfo: string;
}

export default function TechnicalInfoSection({ moreInfo }: TechnicalInfoSectionProps) {
  if (!moreInfo || moreInfo.trim() === '') return null;
  
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-600" />
        More Information
      </h3>
      <Markdown content={moreInfo} />
    </section>
  );
}
