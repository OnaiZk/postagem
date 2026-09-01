import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: 'orange' | 'green' | 'purple' | 'yellow' | 'zinc';
  icon: React.ReactNode;
  variant?: 'primary' | 'black' | 'white' | 'purple';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeColor = 'orange',
  icon,
  variant = 'white',
  onClick
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#FF4F00] text-white border-transparent shadow-lg shadow-orange-500/20';
      case 'black':
        return 'bg-[#000000] text-white border-zinc-800 shadow-lg';
      case 'purple':
        return 'bg-[#4E18FF] text-white border-transparent shadow-lg shadow-purple-500/20';
      default:
        return 'bg-white text-zinc-900 border-zinc-200 shadow-sm hover:shadow-md';
    }
  };

  const getBadgeStyles = () => {
    switch (badgeColor) {
      case 'orange':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'green':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'yellow':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const isDark = variant === 'primary' || variant === 'black' || variant === 'purple';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${getVariantStyles()} ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/80' : 'text-zinc-500'}`}>
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/15 text-white' : 'bg-zinc-100 text-[#FF4F00]'}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-3xl font-black tracking-tight leading-none">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>

        {(subtitle || badgeText) && (
          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap text-xs">
            {subtitle && (
              <span className={isDark ? 'text-white/70' : 'text-zinc-500'}>
                {subtitle}
              </span>
            )}
            {badgeText && (
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                isDark ? 'bg-white/20 text-white border-white/30' : getBadgeStyles()
              }`}>
                {badgeText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
