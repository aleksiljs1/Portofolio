import { cn } from '@/lib/utils'

type TechCategory = 'FRAMEWORK' | 'LANGUAGE' | 'SKILL'

interface TechBadgeProps {
  name: string
  category: TechCategory
  className?: string
}

const categoryStyles: Record<TechCategory, string> = {
  FRAMEWORK: 'bg-sky-400/20 text-sky-400 border-sky-400/30',
  LANGUAGE: 'bg-indigo-400/20 text-indigo-400 border-indigo-400/30',
  SKILL: 'bg-white/10 text-white/70 border-white/20',
}

export function TechBadge({ name, category, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        categoryStyles[category],
        className
      )}
    >
      {name}
    </span>
  )
}
