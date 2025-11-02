import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPageTemplate from '@/components/CategoryPageTemplate';
import { fromCategoryUrlSlug, toCategoryUrlSlug } from '@/lib/files-categories';
import { listFileTypesByCategory } from '@/lib/server/filetypes-repo';

interface FileTypeData {
  extension: string;
  name: string;
  summary: string;
  category?: string;
  categorySlug?: string;
  developer?: string;
  image?: {
    icon?: string;
  };
}

interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  fileTypes: FileTypeData[];
}

const categoryMetadata: Record<string, { name: string; description: string }> = {
  'web': {
    name: 'Web Files',
    description: 'Files used for web development and internet applications, including data interchange formats, stylesheets, and web technologies.'
  },
  'page_layout': {
    name: 'Page Layout Files',
    description: 'Document and page layout files used for creating, viewing, and sharing formatted documents across different platforms.'
  },
  'raster_image': {
    name: 'Raster Image Files',
    description: 'Bitmap image files composed of pixels, commonly used for photographs, digital art, and web graphics.'
  },
  'vector_image': {
    name: 'Vector Image Files',
    description: 'Scalable graphics files that use mathematical formulas to represent images, ideal for logos, illustrations, and designs.'
  },
  'data': {
    name: 'Data Files',
    description: 'Structured data files used for storing and exchanging information between applications and databases.'
  },
  'text': {
    name: 'Text Files',
    description: 'Plain text and formatted text documents used for writing, coding, and documentation.'
  },
  'video': {
    name: 'Video Files',
    description: 'Digital video files containing moving images and audio, used for movies, clips, and streaming content.'
  },
  'audio': {
    name: 'Audio Files',
    description: 'Digital audio files containing music, podcasts, sound effects, and other audio content.'
  },
  'compressed': {
    name: 'Compressed Files',
    description: 'Archive files that contain one or more compressed files or folders, used for storage and file transfer.'
  },
  'executable': {
    name: 'Executable Files',
    description: 'Program files that can be run directly by the operating system to perform specific tasks or launch applications.'
  },
  'game': {
    name: 'Game Files',
    description: 'Files used by video games for storing game data, saves, configurations, and resources.'
  },
  'database': {
    name: 'Database Files',
    description: 'Structured data storage files used by database management systems to organize and retrieve information.'
  },
  'developer': {
    name: 'Developer Files',
    description: 'Source code, configuration, and project files used in software development and programming.'
  },
  'system': {
    name: 'System Files',
    description: 'Operating system and configuration files essential for system functionality and settings.'
  },
  'misc': {
    name: 'Misc Files',
    description: 'Various file types that don\'t fit into other standard categories.'
  }
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getCategoryData(categorySlug: string): Promise<CategoryInfo | null> {
  try {
    // Normalize incoming slug from URL (hyphenated) to internal (underscored)
    const internalSlug = fromCategoryUrlSlug(categorySlug);

    // Get category metadata
    const categoryInfo = categoryMetadata[internalSlug];
    if (!categoryInfo) {
      return null;
    }

    // Query DB for this category
    const rows = await listFileTypesByCategory(internalSlug, 20000, 0);
    const fileTypes: FileTypeData[] = rows.map((r: any) => ({
      extension: r.extension || r.slug,
      name: r.name,
      summary: r.summary,
      category: categoryMetadata[internalSlug]?.name,
      categorySlug: internalSlug,
      developer: r.developer,
    }));

    // Sort file types alphabetically by extension (fallback-safe)
    fileTypes.sort((a, b) => (a.extension || '').localeCompare(b.extension || ''));

    return {
      name: categoryInfo.name,
      slug: internalSlug,
      description: categoryInfo.description,
      fileTypes
    };
  } catch (error) {
    console.error('Error getting category data:', error);
    return null;
  }
}

export async function generateStaticParams() {
  // Generate params for all known categories
  return Object.keys(categoryMetadata).map(slug => ({
    category: toCategoryUrlSlug(slug)
  }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await getCategoryData(category);

  if (!categoryData) {
    return {
      title: 'Category Not Found',
      description: 'The requested file category could not be found.'
    };
  }

  return {
    title: `${categoryData.name} - File Types & Extensions`,
    description: `Browse ${categoryData.fileTypes.length} ${categoryData.name.toLowerCase()}. ${categoryData.description}`,
    keywords: `${categoryData.name}, file types, file extensions, ${categoryData.fileTypes.slice(0, 5).map(ft => `.${ft.extension}`).join(', ')}`,
    openGraph: {
      title: `${categoryData.name} - File Types & Extensions`,
      description: categoryData.description,
      type: 'website',
    }
  };
}

export default async function CategoryPage({ params }: any) {
  const { category } = await params;
  const categoryData = await getCategoryData(category);

  if (!categoryData) {
    notFound();
  }

  return <CategoryPageTemplate data={categoryData} />;
}
