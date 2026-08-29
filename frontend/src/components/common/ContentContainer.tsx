import type { ReactNode } from 'react';

export interface ContentContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * 全站统一的居中内容宽度约束容器 (max-w-3xl = 768px)
 */
export default function ContentContainer({
  children,
  className = ''
}: ContentContainerProps) {
  return (
    <div className={`w-full max-w-3xl mx-auto flex flex-col gap-3 ${className}`}>
      {children}
    </div>
  );
}
