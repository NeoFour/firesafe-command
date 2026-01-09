import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  BarChart3,
  Brain,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Demo data
const monthlyTrends = [
  { month: 'Jul', applications: 42, approvals: 35, rejections: 4 },
  { month: 'Aug', applications: 48, approvals: 40, rejections: 5 },
  { month: 'Sep', applications: 55, approvals: 48, rejections: 3 },
  { month: 'Oct', applications: 62, approvals: 55, rejections: 4 },
  { month: 'Nov', applications: 58, approvals: 52, rejections: 3 },
  { month: 'Dec', applications: 71, approvals: 62, rejections: 6 },
  { month: 'Jan', applications: 68, approvals: 58, rejections: 4 },
];

const riskDistribution = [
  { name: 'Low', value: 145, color: 'hsl(142, 71%, 45%)' },
  { name: 'Medium', value: 98, color: 'hsl(38, 92%, 50%)' },
  { name: 'High', value: 42, color: 'hsl(25, 95%, 53%)' },
  { name: 'Critical', value: 15, color: 'hsl(0, 72%, 51%)' },
];

const categoryDistribution = [
  { category: 'Residential', count: 85 },
  { category: 'Commercial', count: 62 },
  { category: 'Hospital', count: 28 },
  { category: 'School', count: 45 },
  { category: 'Factory', count: 32 },
  { category: 'Hotel', count: 24 },
  { category: 'Mall', count: 18 },
  { category: 'Warehouse', count: 15 },
];

const officerPerformance = [
  { name: 'Officer Sharma', inspections: 45, avgScore: 82, slaCompliance: 94 },
  { name: 'Officer Patel', inspections: 38, avgScore: 78, slaCompliance: 88 },
  { name: 'Officer Kumar', inspections: 42, avgScore: 85, slaCompliance: 96 },
  { name: 'Officer Singh', inspections: 35, avgScore: 80, slaCompliance: 91 },
];

// AI Predictions (demo)
const predictions = [
  { zone: 'Sector 15 Industrial', riskIncrease: 15, reason: 'Aging infrastructure, pending compliance' },
  { zone: 'Downtown Commercial', riskIncrease: 8, reason: 'High foot traffic, recent violations' },
  { zone: 'Residential Complex A', riskIncrease: -5, reason: 'Recent compliance improvements' },
];

export default function Analytics() {
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const isStaff = roles.some(r => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  // Only senior officers and admins can view analytics
  if (!roles.includes('senior_officer') && !roles.includes('admin')) {
    navigate('/dashboard');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Analytics & Insights</h1>
            <p className="text-muted-foreground mt-1">
              Predictive analytics and performance metrics
            </p>
          </div>
          <Select defaultValue="30d">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Avg. Processing Time"
            value="4.2 days"
            change="-12%"
            changeType="positive"
            icon={Clock}
            iconColor="bg-info"
            description="From submission to NOC"
          />
          <StatsCard
            title="Approval Rate"
            value="87.5%"
            change="+3.2%"
            changeType="positive"
            icon={CheckCircle2}
            iconColor="bg-success"
            description="This month"
          />
          <StatsCard
            title="SLA Compliance"
            value="92.3%"
            change="+1.8%"
            changeType="positive"
            icon={Target}
            iconColor="bg-primary"
            description="On-time completions"
          />
          <StatsCard
            title="High Risk Buildings"
            value="57"
            change="+5"
            changeType="negative"
            icon={AlertTriangle}
            iconColor="bg-destructive"
            description="Require attention"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Application Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Application Trends
              </CardTitle>
              <CardDescription>Monthly applications, approvals, and rejections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
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
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="approvals"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Predictions */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Risk Predictions
            </CardTitle>
            <CardDescription>Predicted risk changes based on historical patterns and current compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {predictions.map((prediction, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-card border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{prediction.zone}</span>
                    <Badge
                      variant={prediction.riskIncrease > 0 ? 'destructive' : 'default'}
                      className="flex items-center gap-1"
                    >
                      {prediction.riskIncrease > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {prediction.riskIncrease > 0 ? '+' : ''}{prediction.riskIncrease}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{prediction.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Buildings by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="category" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Officer Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Officer Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {officerPerformance.map((officer, idx) => (
                  <div key={idx} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{officer.name}</span>
                      <Badge variant="outline">{officer.inspections} inspections</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg Score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full"
                              style={{ width: `${officer.avgScore}%` }}
                            />
                          </div>
                          <span className="font-medium">{officer.avgScore}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SLA Compliance</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${officer.slaCompliance}%` }}
                            />
                          </div>
                          <span className="font-medium">{officer.slaCompliance}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}