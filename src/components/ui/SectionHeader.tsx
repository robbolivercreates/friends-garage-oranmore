import React from 'react';
import { Reveal } from './Reveal';

interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  /** 'light' for paper backgrounds, 'dark' for ink backgrounds */
  theme?: 'light' | 'dark';
  align?: 'center' | 'left';
  className?: string;
}

/**
 * Standard section header: eyebrow tag, display heading, optional lead paragraph.
 * Keeps typographic rhythm identical across every page.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  theme = 'light',
  align = 'center',
  className = ''
}) => {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left';
  const titleCls = theme === 'dark' ? 'text-white' : 'text-ink-950';
  const subCls = theme === 'dark' ? 'text-ink-200' : 'text-ink-400';

  return (
    <Reveal className={`max-w-3xl space-y-4 ${alignCls} ${className}`}>
      <span className={`eyebrow ${align === 'center' ? 'justify-center' : ''}`}>{eyebrow}</span>
      <h2 className={`text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.08] ${titleCls}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base leading-relaxed ${subCls}`}>{subtitle}</p>
      )}
    </Reveal>
  );
};
