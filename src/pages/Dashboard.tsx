import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardCheck,
  Shield,
  AlertTriangle,
  Building2,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Demo data for charts
const trendData = [
  { month: 'Jan', applications: 45, approvals: 38 },
  { month: 'Feb', applications: 52, approvals: 45 },
  { month: 'Mar', applications: 61, approvals: 55 },
  { month: 'Apr', applications: 58, approvals: 50 },
  { month: 'May', applications: 72, approvals: 65 },
  { month: 'Jun', applications: 68, approvals: 62 },
];

const riskDistribution = [
  { name: 'Low Risk', value: 45, color: 'hsl(142, 71%, 45%)' },
  { name: 'Medium Risk', value: 30, color: 'hsl(38, 92%, 50%)' },
  { name: 'High Risk', value: 18, color: 'hsl(25, 95%, 53%)' },
  { name: 'Critical', value: 7, color: 'hsl(0, 72%, 51%)' },
];

type RecentApplicationRow = {
  id: string;
  application_number: string;
  status: any;
  submitted_at: string | null;
  created_at: string;
  buildings: null | {
    name: string;
    risk_level: any | null;
  };
};

// Demo upcoming inspections
const upcomingInspections = [
  { id: '1', building: 'Green Valley School', address: '45 Education Lane', date: 'Today, 2:00 PM', priority: 'high' },
  { id: '2', building: 'Phoenix Mall', address: '123 Commercial St', date: 'Tomorrow, 10:00 AM', priority: 'medium' },
  { id: '3', building: 'Harmony Apartments', address: '78 Residential Ave', date: 'Jan 8, 11:30 AM', priority: 'low' },
];

export default function Dashboard() {
  const { user, isLoading, roles, profile } = useAuth();
  const navigate = useNavigate();
  const isStaff = roles.some(r => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  const [recentApplications, setRecentApplications] = useState<RecentApplicationRow[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadRecent = async () => {
      setIsRecentLoading(true);
      try {
        let q = supabase
          .from('applications')
          .select('id, application_number, status, submitted_at, created_at, buildings(name, risk_level)')
          .order('created_at', { ascending: false })
          .limit(4);

        if (!isStaff) {
          q = q.eq('applicant_id', user.id);
        }

        const { data, error } = await q;
        if (error) throw error;
        setRecentApplications((data ?? []) as RecentApplicationRow[]);
      } catch {
        setRecentApplications([]);
      } finally {
        setIsRecentLoading(false);
      }
    };

    loadRecent();
  }, [user, isStaff]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with fire safety compliance today.
            </p>
          </div>
          {!isStaff && (
            <Button onClick={() => navigate('/applications/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          )}
        </div>

        {/* Stats Grid - Only show for staff */}
        {isStaff && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Applications"
              value="156"
              change="+12%"
              changeType="positive"
              icon={FileText}
              iconColor="bg-info"
              description="This month"
            />
            <StatsCard
              title="Pending Inspections"
              value="23"
              change="-5"
              changeType="negative"
              icon={ClipboardCheck}
              iconColor="bg-warning"
              description="Awaiting schedule"
            />
            <StatsCard
              title="NOCs Issued"
              value="89"
              change="+8%"
              changeType="positive"
              icon={Shield}
              iconColor="bg-success"
              description="This month"
            />
            <StatsCard
              title="High Risk Buildings"
              value="12"
              icon={AlertTriangle}
              iconColor="bg-destructive"
              description="Require attention"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Applications */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Recent Applications</CardTitle>
                <CardDescription>Latest application submissions and updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/applications')}>
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isRecentLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
                ) : recentApplications.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">No applications yet.</p>
                  </div>
                ) : (
                  recentApplications.map((app) => {
                    const submitted = new Date(app.submitted_at ?? app.created_at).toLocaleDateString();
                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{app.buildings?.name ?? 'Unknown building'}</p>
                            <p className="text-sm text-muted-foreground">{app.application_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <RiskBadge level={(app.buildings?.risk_level ?? 'medium') as any} size="sm" showIcon={false} />
                          <StatusBadge status={app.status as any} size="sm" />
                          <span className="text-xs text-muted-foreground hidden sm:block">{submitted}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Inspections (Staff Only) or Quick Actions */}
          {isStaff ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingInspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm">{inspection.building}</p>
                        <Badge
                          variant={
                            inspection.priority === 'high' ? 'destructive' :
                            inspection.priority === 'medium' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {inspection.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{inspection.address}</p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Clock className="h-3 w-3" />
                        {inspection.date}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/inspections')}>
                  View All Inspections
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/applications/new')}>
                  <Plus className="h-4 w-4" />
                  New NOC Application
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/buildings')}>
                  <Building2 className="h-4 w-4" />
                  Manage Buildings
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/verify')}>
                  <Shield className="h-4 w-4" />
                  Verify NOC
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/grievances')}>
                  <FileText className="h-4 w-4" />
                  Submit Grievance
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analytics Section (Staff Only) */}
        {isStaff && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Application Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Application Trends
                </CardTitle>
                <CardDescription>Applications vs Approvals over 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="applications"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="approvals"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--success))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Building Risk Distribution
                </CardTitle>
                <CardDescription>Current risk assessment across all buildings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}