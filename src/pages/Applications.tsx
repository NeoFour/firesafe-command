import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileEdit,
  Building2,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Demo data (shown only when there are no real applications yet)
const demoApplications = [
  { id: '1', number: 'APP-20250106-0001', building: 'City Mall Complex', category: 'mall', applicant: 'Rajesh Kumar', status: 'under_review' as const, risk: 'medium' as const, submitted: '2025-01-06', priority: 5 },
  { id: '2', number: 'APP-20250105-0042', building: 'Metro Hospital', category: 'hospital', applicant: 'Dr. Priya Sharma', status: 'inspection_scheduled' as const, risk: 'high' as const, submitted: '2025-01-05', priority: 8 },
  { id: '3', number: 'APP-20250105-0038', building: 'Sunrise Apartments', category: 'residential', applicant: 'Amit Patel', status: 'approved' as const, risk: 'low' as const, submitted: '2025-01-05', priority: 3 },
  { id: '4', number: 'APP-20250104-0021', building: 'Tech Park Tower', category: 'office', applicant: 'Infosys Ltd', status: 'requires_compliance' as const, risk: 'high' as const, submitted: '2025-01-04', priority: 7 },
  { id: '5', number: 'APP-20250104-0019', building: 'Grand Hotel', category: 'hotel', applicant: 'Taj Hotels', status: 'inspection_completed' as const, risk: 'medium' as const, submitted: '2025-01-04', priority: 6 },
  { id: '6', number: 'APP-20250103-0015', building: 'St. Mary School', category: 'school', applicant: 'Principal Sr. Mary', status: 'approved' as const, risk: 'low' as const, submitted: '2025-01-03', priority: 4 },
  { id: '7', number: 'APP-20250103-0012', building: 'Industrial Warehouse', category: 'warehouse', applicant: 'Logistics Corp', status: 'submitted' as const, risk: 'high' as const, submitted: '2025-01-03', priority: 8 },
  { id: '8', number: 'APP-20250102-0008', building: 'Residential Tower B', category: 'residential', applicant: 'Builder Associates', status: 'rejected' as const, risk: 'critical' as const, submitted: '2025-01-02', priority: 9 },
];

type DbApplication = {
  id: string;
  application_number: string;
  applicant_id: string;
  application_type: string;
  status: any;
  submitted_at: string | null;
  created_at: string;
  buildings: null | {
    name: string;
    category: any;
    risk_level: any | null;
    risk_score: number | null;
  };
};

export default function Applications() {
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [dbApplications, setDbApplications] = useState<DbApplication[]>([]);
  const [isFetching, setIsFetching] = useState(true); // Start as true to show loading initially
  const [useDemoData, setUseDemoData] = useState(false); // Default to false, only enable for staff when no data

  const isStaff = roles.some((r) => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setIsFetching(true);
      try {
        let q = supabase
          .from('applications')
          .select(
            'id, application_number, applicant_id, application_type, status, submitted_at, created_at, buildings(name, category, risk_level, risk_score)'
          )
          .order('created_at', { ascending: false });

        // RLS already limits applicants, but this keeps intent explicit.
        if (!isStaff) {
          q = q.eq('applicant_id', user.id);
        }

        const { data, error } = await q;
        if (error) throw error;

        const rows = (data ?? []) as DbApplication[];
        setDbApplications(rows);
        // Only show demo data for staff members when no real applications exist
        setUseDemoData(isStaff && rows.length === 0);
      } catch (err: any) {
        console.error('Failed to load applications:', err);
        toast.error(err?.message || 'Failed to load applications');
        setDbApplications([]);
        // Only show demo data for staff on error
        setUseDemoData(isStaff);
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, [user, isStaff]);

  const list = useMemo(() => {
    if (useDemoData) {
      return demoApplications.map((a) => ({ ...a, riskScore: undefined as number | undefined }));
    }

    return dbApplications.map((a) => {
      const submittedDate = a.submitted_at ?? a.created_at;
      return {
        id: a.id,
        number: a.application_number,
        building: a.buildings?.name ?? 'Unknown building',
        category: a.buildings?.category ?? 'other',
        applicant: isStaff ? `${a.applicant_id.slice(0, 8)}…` : 'You',
        status: a.status,
        risk: (a.buildings?.risk_level ?? 'medium') as any,
        riskScore: a.buildings?.risk_score ?? undefined,
        submitted: new Date(submittedDate).toLocaleDateString(),
      };
    });
  }, [dbApplications, isStaff, useDemoData]);

  if (isLoading || !user) return null;

  const filteredApplications = list.filter((app) => {
    const matchesSearch =
      app.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Applications</h1>
            <p className="text-muted-foreground mt-1">
              {isStaff ? 'Manage all fire safety NOC applications' : 'View and manage your NOC applications'}
            </p>
          </div>
          {!isStaff && (
            <Button onClick={() => navigate('/applications/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          )}
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                  <SelectItem value="inspection_completed">Inspection Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="requires_compliance">Requires Compliance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="mall">Mall</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="factory">Factory</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead className="hidden md:table-cell">Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Risk</TableHead>
                  <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{app.number}</div>
                      <div className="text-xs text-muted-foreground capitalize">{app.category}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{app.building}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{app.applicant}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status as any} size="sm" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <RiskBadge level={app.risk as any} score={app.riskScore} size="sm" showIcon={false} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Calendar className="h-3 w-3" />
                        {app.submitted}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/applications/${app.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {app.status === 'draft' && (
                            <DropdownMenuItem>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Edit Draft
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isFetching && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Loading applications…</p>
              </div>
            )}

            {filteredApplications.length === 0 && !isFetching && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No applications found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
