import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';

// Demo deficiencies data
const demoDeficiencies = [
  { id: '1', building: 'Tech Park Tower', title: 'Missing fire extinguisher on 5th floor', severity: 'high' as const, status: 'open' as const, deadline: '2025-01-15', daysRemaining: 9 },
  { id: '2', building: 'Industrial Warehouse', title: 'Blocked emergency exit in loading bay', severity: 'critical' as const, status: 'open' as const, deadline: '2025-01-08', daysRemaining: 2 },
  { id: '3', building: 'Metro Hospital', title: 'Expired fire alarm system certification', severity: 'high' as const, status: 'in_progress' as const, deadline: '2025-01-20', daysRemaining: 14 },
  { id: '4', building: 'Grand Hotel', title: 'Sprinkler system maintenance overdue', severity: 'medium' as const, status: 'open' as const, deadline: '2025-01-25', daysRemaining: 19 },
  { id: '5', building: 'Phoenix Factory', title: 'Inadequate hazmat storage ventilation', severity: 'critical' as const, status: 'in_progress' as const, deadline: '2025-01-10', daysRemaining: 4 },
  { id: '6', building: 'City Mall Complex', title: 'Emergency lighting failure in basement', severity: 'medium' as const, status: 'resolved' as const, deadline: '2025-01-01', resolvedDate: '2024-12-28' },
  { id: '7', building: 'Sunrise Apartments', title: 'Fire door not self-closing properly', severity: 'low' as const, status: 'resolved' as const, deadline: '2025-01-03', resolvedDate: '2025-01-02' },
];

const statusConfig = {
  open: { label: 'Open', icon: AlertCircle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-warning/15 text-warning border-warning/30' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'bg-success/15 text-success border-success/30' },
  overdue: { label: 'Overdue', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function Deficiencies() {
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const isStaff = roles.some(r => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  if (!isStaff) {
    navigate('/dashboard');
    return null;
  }

  const filteredDeficiencies = demoDeficiencies.filter(d => {
    const matchesSearch = 
      d.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || d.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const openDeficiencies = filteredDeficiencies.filter(d => d.status === 'open' || d.status === 'in_progress');
  const resolvedDeficiencies = filteredDeficiencies.filter(d => d.status === 'resolved');

  const DeficiencyCard = ({ deficiency }: { deficiency: typeof demoDeficiencies[0] }) => {
    const config = statusConfig[deficiency.status];
    const StatusIcon = config.icon;
    const isUrgent = deficiency.daysRemaining !== undefined && deficiency.daysRemaining <= 3;

    return (
      <Card className={`hover:shadow-lg transition-shadow ${isUrgent && deficiency.status !== 'resolved' ? 'border-destructive/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                deficiency.severity === 'critical' ? 'bg-destructive/10' :
                deficiency.severity === 'high' ? 'bg-orange-500/10' :
                deficiency.severity === 'medium' ? 'bg-warning/10' : 'bg-muted'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  deficiency.severity === 'critical' ? 'text-destructive' :
                  deficiency.severity === 'high' ? 'text-orange-500' :
                  deficiency.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <h3 className="font-medium text-sm">{deficiency.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{deficiency.building}</span>
                </div>
              </div>
            </div>
            <RiskBadge level={deficiency.severity} size="sm" showIcon={false} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <Badge variant="outline" className={config.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>

            {deficiency.status !== 'resolved' && deficiency.daysRemaining !== undefined && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                deficiency.daysRemaining <= 3 ? 'text-destructive' :
                deficiency.daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'
              }`}>
                <Calendar className="h-3 w-3" />
                <span>{deficiency.daysRemaining} days left</span>
              </div>
            )}

            {deficiency.status === 'resolved' && (
              <div className="flex items-center gap-1 text-xs text-success">
                <CheckCircle2 className="h-3 w-3" />
                <span>Resolved {deficiency.resolvedDate}</span>
              </div>
            )}
          </div>

          {deficiency.status !== 'resolved' && (
            <Button size="sm" className="w-full mt-3">
              {deficiency.status === 'open' ? 'Start Resolution' : 'Mark Resolved'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Deficiencies</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage fire safety compliance issues
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{openDeficiencies.filter(d => d.severity === 'critical').length}</div>
              <p className="text-sm text-muted-foreground">Critical Issues</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">{openDeficiencies.filter(d => d.severity === 'high').length}</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{openDeficiencies.filter(d => d.daysRemaining !== undefined && d.daysRemaining <= 7).length}</div>
              <p className="text-sm text-muted-foreground">Due This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{resolvedDeficiencies.length}</div>
              <p className="text-sm text-muted-foreground">Resolved This Month</p>
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
                  placeholder="Search by building or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList>
            <TabsTrigger value="open">
              Open ({openDeficiencies.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedDeficiencies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {openDeficiencies.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openDeficiencies.map((deficiency) => (
                  <DeficiencyCard key={deficiency.id} deficiency={deficiency} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">No open deficiencies. All buildings are compliant!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            {resolvedDeficiencies.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resolvedDeficiencies.map((deficiency) => (
                  <DeficiencyCard key={deficiency.id} deficiency={deficiency} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No resolved deficiencies in this period.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}