import { notFound, redirect } from 'next/navigation';
import FileTypePageTemplate from '@/components/FileTypePageTemplate';
import { transformFileTypeData } from '@/lib/files-transformer';
import type { FileTypeRawData, FileTypeTemplateData } from '@/types';
import { getFileTypeRaw } from '@/lib/server/filetypes-repo';
import { fromRouteParam } from '@/lib/filetypes-slug';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getFileTypeData(slug: string): Promise<FileTypeTemplateData | null> {
  try {
    const raw = await getFileTypeRaw(slug);
    if (!raw) return null;
    return transformFileTypeData(raw as unknown as FileTypeRawData);
  } catch {
    return null;
  }
}

// No SSG params — page is DB-backed and dynamic

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const norm = fromRouteParam(slug);
  const data = await getFileTypeData(norm);
  if (!data) return { title: 'File Type Not Found' };
  return {
    title: `${data.extension.toUpperCase()} File - ${data.name} | What is .${data.extension}?`,
    description: data.description || data.summary,
    openGraph: {
      title: `${data.extension.toUpperCase()} File - ${data.name}`,
      description: data.description || data.summary,
      type: 'article',
    },
  };
}

export default async function FileTypePage({ params }: any) {
  const { slug } = await params;
  const norm = fromRouteParam(slug);
  const data = await getFileTypeData(norm);
  if (!data) notFound();
  return <FileTypePageTemplate data={data} />;
}
