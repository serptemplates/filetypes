"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  className?: string;
}

export default function Markdown({ content, className }: MarkdownProps) {
  if (!content || content.trim() === '') return null;
  return (
    <div className={className ?? 'prose prose-gray max-w-none'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

