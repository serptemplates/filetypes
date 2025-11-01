import React from 'react';
import Markdown from '@/components/common/Markdown';

interface AdditionalSectionProps {
  title: string;
  content: string;
}

export default function AdditionalSection({ title, content }: AdditionalSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <Markdown content={content} />
    </section>
  );
}
