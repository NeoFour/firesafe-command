import { cn } from '@/lib/utils';
import {
  FileText,
  Send,
  FileSearch,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'inspection_scheduled' | 'inspection_completed' | 'approved' | 'rejected' | 'requires_compliance';

interface TimelineStep {
  id: ApplicationStatus;
  label: string;
  icon: typeof FileText;
}

const steps: TimelineStep[] = [
  { id: 'draft', label: 'Draft', icon: FileText },
  { id: 'submitted', label: 'Submitted', icon: Send },
  { id: 'under_review', label: 'Under Review', icon: FileSearch },
  { id: 'inspection_scheduled', label: 'Inspection Scheduled', icon: Calendar },
  { id: 'inspection_completed', label: 'Inspection Done', icon: ClipboardCheck },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 }
];

interface ApplicationTimelineProps {
  currentStatus: ApplicationStatus;
  isRejected?: boolean;
}

export function ApplicationTimeline({ currentStatus }: ApplicationTimelineProps) {
  const isRejected = currentStatus === 'rejected';
  const isApproved = currentStatus === 'approved';
  
  const getStepStatus = (stepId: ApplicationStatus) => {
    if (isRejected && stepId === 'approved') return 'rejected';
    if (isApproved && stepId === 'approved') return 'approved';
    
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = status === 'rejected' ? XCircle : step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  status === 'completed' && "bg-success text-success-foreground",
                  status === 'current' && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  status === 'upcoming' && "bg-muted text-muted-foreground",
                  status === 'rejected' && "bg-destructive text-destructive-foreground",
                  status === 'approved' && "bg-green-500 text-white ring-4 ring-green-500/20"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "mt-2 text-xs font-medium text-center max-w-[80px]",
                status === 'current' && "text-primary font-semibold",
                status === 'completed' && "text-foreground",
                status === 'rejected' && "text-destructive font-semibold",
                status === 'approved' && "text-green-600 dark:text-green-400 font-bold",
                status === 'upcoming' && "text-muted-foreground"
              )}>
                {status === 'rejected' ? 'Rejected' : status === 'approved' ? 'Approved ✓' : step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
        <div
          className={cn(
            "h-full transition-all duration-500",
            isRejected ? "bg-destructive" : "bg-success"
          )}
          style={{
            width: `${(steps.findIndex(s => s.id === currentStatus) / (steps.length - 1)) * 100}%`
          }}
        />
      </div>
    </div>
  );
}