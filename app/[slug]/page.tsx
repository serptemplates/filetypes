import { redirect } from 'next/navigation';
import { hrefFiletype } from '@/lib/url';
export default async function RedirectOldFiletype({ params }: any) {
  const { slug } = await params;
  redirect(hrefFiletype(slug));
}
