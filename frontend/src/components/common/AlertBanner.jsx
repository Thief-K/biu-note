import React from 'react';
import { AlertCircle } from 'lucide-react';

const VARIANT_CONFIGS = {
  warning: {
    container: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
    defaultIcon: AlertCircle
  },
  error: {
    container: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
    iconColor: 'text-red-600 dark:text-red-400',
    defaultIcon: AlertCircle
  }
};

/**
 * 通用提示与警告横幅组件
 */
export default function AlertBanner({
  variant = 'error',
  icon: CustomIcon,
  message,
  action,
  className = '',
  children
}) {
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.error;
  const Icon = CustomIcon || config.defaultIcon;

  return (
    <div
      className={`px-3.5 py-2 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all select-none ${config.container} ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {Icon && <Icon className={`w-4 h-4 shrink-0 stroke-[2.2] ${config.iconColor}`} />}
        <div className="font-medium truncate leading-relaxed flex-1">
          {message || children}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center">{action}</div>}
    </div>
  );
}
