import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Clock,
  Shield,
  Building2,
  Eye,
  CalendarIcon,
  Upload,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Application = {
  id: string;
  application_number: string;
  applicant_id: string;
  application_type: string;
  status: string;
  purpose: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  rejection_reason: string | null;
  buildings: {
    name: string;
    category: string;
    risk_level: string | null;
    address: string;
    city: string;
  } | null;
};

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function AdminDashboard() {
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Dialog states
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showCompleteInspectionDialog, setShowCompleteInspectionDialog] = useState(false);
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Scheduling states
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Inspection completion states
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [overallScore, setOverallScore] = useState('');
  const [inspectionPhotos, setInspectionPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!isLoading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [user, isLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadApplications();
  }, [user, isAdmin]);

  const loadApplications = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          application_number,
          applicant_id,
          application_type,
          status,
          purpose,
          notes,
          submitted_at,
          created_at,
          rejection_reason,
          buildings(name, category, risk_level, address, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data ?? []) as Application[]);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setIsFetching(false);
    }
  };

  const handleScheduleInspection = async () => {
    if (!selectedApp || !scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('schedule-inspection', {
        body: {
          applicationId: selectedApp.id,
          scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
          scheduledTime: scheduledTime,
        },
      });

      if (error) throw error;

      toast.success(`Inspection scheduled for ${selectedApp.application_number}!`);
      setShowScheduleDialog(false);
      setSelectedApp(null);
      setScheduledDate(undefined);
      setScheduledTime('');
      loadApplications();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to schedule inspection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (!selectedApp) return;
    
    setIsProcessing(true);
    try {
      // First get the inspection ID
      const { data: inspection, error: inspError } = await supabase
        .from('inspections')
        .select('id')
        .eq('application_id', selectedApp.id)
        .single();

      if (inspError || !inspection) {
        toast.error('Inspection not found');
        return;
      }

      // Upload photos if any
      let photoUrls: string[] = [];
      if (inspectionPhotos.length > 0) {
        setIsUploading(true);
        for (const photo of inspectionPhotos) {
          const fileName = `${inspection.id}/${Date.now()}-${photo.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('inspection-photos')
            .upload(fileName, photo);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('inspection-photos')
            .getPublicUrl(uploadData.path);

          photoUrls.push(urlData.publicUrl);
        }
        setIsUploading(false);
      }

      const { error } = await supabase.functions.invoke('complete-inspection', {
        body: {
          inspectionId: inspection.id,
          findings: findings || null,
          recommendations: recommendations || null,
          overallScore: overallScore ? parseInt(overallScore) : null,
          photoUrls,
        },
      });

      if (error) throw error;

      toast.success(`Inspection completed for ${selectedApp.application_number}!`);
      setShowCompleteInspectionDialog(false);
      resetInspectionForm();
      loadApplications();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete inspection');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const resetInspectionForm = () => {
    setSelectedApp(null);
    setFindings('');
    setRecommendations('');
    setOverallScore('');
    setInspectionPhotos([]);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-application-decision', {
        body: {
          applicationId: selectedApp.id,
          decision: 'approve',
        },
      });

      if (error) throw error;

      toast.success(`Application ${selectedApp.application_number} approved successfully!`);
      setShowApproveDialog(false);
      setSelectedApp(null);
      loadApplications();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('admin-application-decision', {
        body: {
          applicationId: selectedApp.id,
          decision: 'reject',
          rejectionReason: rejectionReason.trim(),
        },
      });

      if (error) throw error;

      toast.success(`Application ${selectedApp.application_number} rejected.`);
      setShowRejectDialog(false);
      setSelectedApp(null);
      setRejectionReason('');
      loadApplications();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setInspectionPhotos(Array.from(e.target.files));
    }
  };

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter applications based on search and status
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.buildings?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && ['submitted', 'under_review'].includes(app.status)) ||
      (statusFilter === 'inspection' && ['inspection_scheduled', 'inspection_completed'].includes(app.status)) ||
      app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
    inspection: applications.filter(a => ['inspection_scheduled', 'inspection_completed'].includes(a.status)).length,
    approved: applications.filter(a => a.status === 'approved').length,
  };

  // Helper to determine which actions are available
  const getAvailableActions = (app: Application) => {
    const status = app.status;
    return {
      canScheduleInspection: ['submitted', 'under_review'].includes(status),
      canCompleteInspection: status === 'inspection_scheduled',
      canApproveReject: status === 'inspection_completed',
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl lg:text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage and process NOC applications
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Administrator Access
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inspection}</p>
                  <p className="text-sm text-muted-foreground">In Inspection</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by application number, building, or applicant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="inspection">In Inspection</SelectItem>
                  <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                  <SelectItem value="inspection_completed">Inspection Done</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Queue</CardTitle>
            <CardDescription>Review and process NOC applications through the inspection workflow</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Risk</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => {
                  const actions = getAvailableActions(app);
                  return (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{app.application_number}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {app.application_type.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{app.buildings?.name ?? 'Unknown'}</span>
                            <p className="text-xs text-muted-foreground">
                              {app.buildings?.city}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status as any} size="sm" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <RiskBadge level={(app.buildings?.risk_level ?? 'medium') as any} size="sm" showIcon={false} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/${app.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {actions.canScheduleInspection && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApp(app);
                                setShowScheduleDialog(true);
                              }}
                            >
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          )}
                          
                          {actions.canCompleteInspection && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApp(app);
                                setShowCompleteInspectionDialog(true);
                              }}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          
                          {actions.canApproveReject && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-success hover:bg-success/90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApp(app);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApp(app);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {isFetching && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground text-sm mt-2">Loading applications…</p>
              </div>
            )}

            {!isFetching && filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No applications found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Inspection Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Schedule Inspection
            </DialogTitle>
            <DialogDescription>
              Schedule a fire safety inspection for application{' '}
              <strong>{selectedApp?.application_number}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="font-medium">{selectedApp?.buildings?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedApp?.buildings?.address}, {selectedApp?.buildings?.city}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Inspection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleInspection}
              disabled={isProcessing || !scheduledDate || !scheduledTime}
            >
              {isProcessing ? 'Scheduling...' : 'Schedule Inspection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Inspection Dialog */}
      <Dialog open={showCompleteInspectionDialog} onOpenChange={setShowCompleteInspectionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              Complete Inspection
            </DialogTitle>
            <DialogDescription>
              Record inspection findings for application{' '}
              <strong>{selectedApp?.application_number}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="font-medium">{selectedApp?.buildings?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedApp?.buildings?.address}, {selectedApp?.buildings?.city}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Overall Score (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Enter inspection score"
                value={overallScore}
                onChange={(e) => setOverallScore(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Findings</Label>
              <Textarea
                placeholder="Describe the inspection findings..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Recommendations</Label>
              <Textarea
                placeholder="Enter any recommendations..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Inspection Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload photos from the inspection
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="max-w-[250px] mx-auto"
                />
                {inspectionPhotos.length > 0 && (
                  <p className="text-sm text-primary mt-2">
                    {inspectionPhotos.length} photo(s) selected
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCompleteInspectionDialog(false);
              resetInspectionForm();
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCompleteInspection}
              disabled={isProcessing || isUploading}
            >
              {isUploading ? 'Uploading...' : isProcessing ? 'Saving...' : 'Complete Inspection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Approve Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve application{' '}
              <strong>{selectedApp?.application_number}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="font-medium">{selectedApp?.buildings?.name}</p>
              <p className="text-sm text-muted-foreground">
                Inspection has been completed for this application.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-success hover:bg-success/90" 
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting application{' '}
              <strong>{selectedApp?.application_number}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="font-medium">{selectedApp?.buildings?.name}</p>
              <p className="text-sm text-muted-foreground">
                Inspection has been completed for this application.
              </p>
            </div>
            <div>
              <Label>
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
