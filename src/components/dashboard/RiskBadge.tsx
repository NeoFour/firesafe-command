import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const riskConfig = {
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30 hover:bg-success/20'
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertCircle,
    className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20'
  },
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    className: 'bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/20'
  },
  critical: {
    label: 'Critical',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20'
  }
};

export function RiskBadge({ level, score, showIcon = true, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0',
        size === 'md' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1'
      )}
    >
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {config.label}
      {score !== undefined && <span className="ml-1 font-bold">({score})</span>}
    </Badge>
  );
}