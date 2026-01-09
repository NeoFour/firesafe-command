import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  FileSearch,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Send
} from 'lucide-react';

type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'inspection_scheduled' | 'inspection_completed' | 'approved' | 'rejected' | 'requires_compliance';

interface StatusBadgeProps {
  status: ApplicationStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<ApplicationStatus, { label: string; icon: typeof Clock; className: string }> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    className: 'bg-muted text-muted-foreground border-muted-foreground/30'
  },
  submitted: {
    label: 'Submitted',
    icon: Send,
    className: 'bg-info/15 text-info border-info/30'
  },
  under_review: {
    label: 'Under Review',
    icon: FileSearch,
    className: 'bg-primary/15 text-primary border-primary/30'
  },
  inspection_scheduled: {
    label: 'Inspection Scheduled',
    icon: Calendar,
    className: 'bg-warning/15 text-warning border-warning/30'
  },
  inspection_completed: {
    label: 'Inspection Completed',
    icon: CheckCircle2,
    className: 'bg-info/15 text-info border-info/30'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'bg-success/15 text-success border-success/30'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30'
  },
  requires_compliance: {
    label: 'Requires Compliance',
    icon: AlertTriangle,
    className: 'bg-orange-500/15 text-orange-600 border-orange-500/30'
  }
};

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
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
    </Badge>
  );
}