import type { ComponentType, ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * 通用空状态占位组件
 */
export default function EmptyState({
  icon: Icon,
  title,
  className = 'py-24',
  children
}: EmptyStateProps) {
  return (
    <div className={`text-center flex flex-col items-center justify-center text-zinc-500 gap-2.5 ${className}`}>
      {Icon && <Icon className="w-9 h-9 stroke-1 text-zinc-600 mb-1" />}
      {title && <p className="text-xs text-zinc-400 font-medium">{title}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
