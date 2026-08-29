import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 通用图标按钮组件
 */
export default function IconButton({
  icon: Icon,
  onClick,
  type = 'button',
  variant = 'default', // 'default' | 'amber' | 'emerald' | 'blue' | 'danger' | 'ghost' | 'primary'
  size = 'md',        // 'xs' (24px) | 'sm' (28px) | 'md' (32px) | 'lg' (40px)
  shape = 'rounded-xl', // 'rounded-lg' | 'rounded-xl' | 'rounded-full'
  disabled = false,
  loading = false,
  className = '',
  title,
  children
}) {
  const sizeStyles = {
    xs: 'w-6 h-6 p-0 text-xs',
    sm: 'w-7 h-7 p-0 text-xs',
    md: 'w-8 h-8 p-0 text-sm',
    lg: 'w-10 h-10 p-0 text-base'
  }[size] || 'w-8 h-8 p-0 text-sm';

  const iconSizes = {
    xs: 13,
    sm: 15,
    md: 16,
    lg: 20
  }[size] || 16;

  const variantStyles = {
    default: 'bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-100',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400',
    ghost: 'bg-transparent hover:bg-zinc-850/60 border border-transparent text-zinc-400 hover:text-zinc-100',
    primary: 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white shadow-sm shadow-emerald-500/20',
    'primary-emerald': 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white shadow-sm shadow-emerald-500/20',
    'primary-amber': 'bg-amber-500 hover:bg-amber-400 border border-amber-300/60 text-zinc-950 shadow-sm shadow-amber-500/20',
    'primary-blue': 'bg-blue-600 hover:bg-blue-500 border border-blue-400/40 text-white shadow-sm shadow-blue-500/20',
    'primary-purple': 'bg-purple-600 hover:bg-purple-500 border border-purple-400/40 text-white shadow-sm shadow-purple-500/20',
    'primary-danger': 'bg-red-600 hover:bg-red-500 border border-red-400/40 text-white shadow-sm shadow-red-500/20'
  }[variant === 'primary' ? 'primary-emerald' : variant] || '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`grid place-items-center shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 select-none ${shape} ${sizeStyles} ${variantStyles} ${className}`}
    >
      {loading ? (
        <Loader2 size={iconSizes} className="animate-spin text-current" />
      ) : Icon ? (
        <Icon size={iconSizes} className="stroke-[2.2] shrink-0" />
      ) : (
        children
      )}
    </button>
  );
}
