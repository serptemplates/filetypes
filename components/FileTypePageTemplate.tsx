'use client';

import React from 'react';
import FileTypeBreadcrumb from '@/components/files/FileTypeBreadcrumb';
import FileTypeHero from '@/components/files/FileTypeHero';
import WhatIsSection from '@/components/files/WhatIsSection';
import TechnicalInfoSection from '@/components/files/TechnicalInfoSection';
import AdditionalSection from '@/components/files/AdditionalSection';
import HowToOpenSection from '@/components/files/HowToOpenSection';
import FileTypeSidebar from '@/components/files/FileTypeSidebar';
import MimeContainersSection from '@/components/files/MimeContainersSection';
import SignaturesSection from '@/components/files/SignaturesSection';
import ImagesGallery from '@/components/files/ImagesGallery';
import SupportMatrixSection from '@/components/files/SupportMatrixSection';

interface FileTypeData {
  extension: string;
  name: string;
  title: string;
  description: string;
  summary: string;
  category?: string;
  categorySlug?: string;
  developer?: string;
  image: {
    icon?: string;
    screenshot?: string;
    screenshotCaption?: string;
  };
  mime?: string[];
  containers?: string[];
  related?: string[];
  magic?: Array<{ hex: string; offset?: number }>;
  images?: Array<{ url: string; alt?: string; caption?: string }>;
  support?: {
    browsers?: Record<string, 'yes' | 'no' | 'partial'>;
    oses?: Record<string, 'yes' | 'no' | 'partial'>;
    devices?: Record<string, 'yes' | 'no' | 'partial'>;
  };
  // sources intentionally not surfaced in UI
  whatIs: string;
  moreInfo: string;
  howToOpen: string;
  programsThatOpen: Record<string, Array<{
    name: string;
    license?: string;
    url?: string;
  }>>;
  additionalSections: Array<{
    title: string;
    content: string;
  }>;
  relevantTools: Array<{
    category: string;
    description: string;
    tools: Array<{
      title: string;
      href: string;
      description: string;
    }>;
  }>;
  lastUpdated: string;
}

export default function FileTypePageTemplate({ data }: { data: FileTypeData }) {
  console.log('FileTypePageTemplate rendering with data:', {
    extension: data.extension,
    programCount: Object.keys(data.programsThatOpen || {}).length,
    platforms: Object.keys(data.programsThatOpen || {})
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <FileTypeBreadcrumb extension={data.extension} />

      {/* Hero Section */}
      <FileTypeHero
        extension={data.extension}
        name={data.name}
        summary={data.summary}
        category={data.category}
        categorySlug={data.categorySlug}
        developer={data.developer}
        image={data.image}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What Is Section */}
            <WhatIsSection
              extension={data.extension}
              whatIs={data.whatIs}
            />

            {/* MIME, Containers, Related */}
            <MimeContainersSection mime={data.mime} containers={data.containers} related={data.related} />

            {/* Technical Information */}
            <TechnicalInfoSection moreInfo={data.moreInfo} />

            {/* Additional Sections */}
            {data.additionalSections.map((section, idx) => (
              <AdditionalSection
                key={idx}
                title={section.title}
                content={section.content}
              />
            ))}

            {/* Signatures */}
            <SignaturesSection magic={data.magic} />

            {/* Images */}
            <ImagesGallery images={data.images} screenshotUrl={data.image?.screenshot} />

            {/* How to Open Section */}
            <HowToOpenSection
              extension={data.extension}
              howToOpen={data.howToOpen}
              programsThatOpen={data.programsThatOpen}
            />

            {/* Support */}
            <SupportMatrixSection support={data.support} />

            {/* Sources intentionally hidden to avoid linking to competitors */}
          </div>

          {/* Sidebar */}
          <FileTypeSidebar
            extension={data.extension}
            developer={data.developer}
            name={data.name}
            lastUpdated={data.lastUpdated}
            relevantTools={data.relevantTools}
          />
        </div>
      </div>
    </main>
  );
}
