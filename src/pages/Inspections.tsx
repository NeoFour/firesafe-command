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
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ClipboardCheck,
  Navigation,
  Building2
} from 'lucide-react';

// Demo inspections data
const demoInspections = [
  { id: '1', building: 'City Mall Complex', address: '123 Commercial Ave', category: 'mall', date: '2025-01-06', time: '14:00', status: 'scheduled' as const, priority: 'high', gpsVerified: false },
  { id: '2', building: 'Metro Hospital', address: '45 Health Street', category: 'hospital', date: '2025-01-07', time: '10:00', status: 'scheduled' as const, priority: 'high', gpsVerified: false },
  { id: '3', building: 'Sunrise Apartments', address: '78 Residential Lane', category: 'residential', date: '2025-01-05', time: '11:30', status: 'completed' as const, priority: 'medium', score: 85, gpsVerified: true },
  { id: '4', building: 'Tech Park Tower', address: '456 IT Park Road', category: 'office', date: '2025-01-04', time: '15:00', status: 'completed' as const, priority: 'high', score: 45, gpsVerified: true },
  { id: '5', building: 'Grand Hotel', address: '89 Hospitality Blvd', category: 'hotel', date: '2025-01-08', time: '09:00', status: 'scheduled' as const, priority: 'medium', gpsVerified: false },
  { id: '6', building: 'Phoenix Factory', address: '567 Manufacturing Zone', category: 'factory', date: '2025-01-03', time: '14:00', status: 'cancelled' as const, priority: 'critical', gpsVerified: false },
];

const statusConfig = {
  scheduled: { label: 'Scheduled', icon: Calendar, className: 'bg-info/15 text-info border-info/30' },
  in_progress: { label: 'In Progress', icon: ClipboardCheck, className: 'bg-warning/15 text-warning border-warning/30' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-success/15 text-success border-success/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
  rescheduled: { label: 'Rescheduled', icon: AlertCircle, className: 'bg-warning/15 text-warning border-warning/30' },
};

export default function Inspections() {
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const isStaff = roles.some(r => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  // Redirect non-staff users
  if (!isStaff) {
    navigate('/dashboard');
    return null;
  }

  const filteredInspections = demoInspections.filter(i => {
    const matchesSearch = 
      i.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scheduledInspections = filteredInspections.filter(i => i.status === 'scheduled');
  const completedInspections = filteredInspections.filter(i => i.status === 'completed');

  const InspectionCard = ({ inspection }: { inspection: typeof demoInspections[0] }) => {
    const config = statusConfig[inspection.status];
    const StatusIcon = config.icon;

    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{inspection.building}</h3>
                <Badge variant="outline" className="capitalize text-xs mt-1">
                  {inspection.category}
                </Badge>
              </div>
            </div>
            <Badge
              variant={
                inspection.priority === 'critical' ? 'destructive' :
                inspection.priority === 'high' ? 'default' : 'secondary'
              }
              className="text-xs"
            >
              {inspection.priority}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{inspection.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{inspection.date}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{inspection.time}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <Badge variant="outline" className={config.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>

            {inspection.status === 'completed' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Score:</span>
                <span className={`font-bold ${
                  (inspection.score ?? 0) >= 70 ? 'text-success' :
                  (inspection.score ?? 0) >= 50 ? 'text-warning' : 'text-destructive'
                }`}>
                  {inspection.score}%
                </span>
              </div>
            )}

            {inspection.gpsVerified && (
              <div className="flex items-center gap-1 text-success text-xs">
                <Navigation className="h-3 w-3" />
                <span>GPS Verified</span>
              </div>
            )}
          </div>

          {inspection.status === 'scheduled' && (
            <Button className="w-full mt-4 gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Start Inspection
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
          <h1 className="text-2xl lg:text-3xl font-bold">Inspections</h1>
          <p className="text-muted-foreground mt-1">
            Manage and conduct fire safety inspections
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by building name or address..."
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({scheduledInspections.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedInspections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {scheduledInspections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scheduledInspections.map((inspection) => (
                  <InspectionCard key={inspection.id} inspection={inspection} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No upcoming inspections found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedInspections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedInspections.map((inspection) => (
                  <InspectionCard key={inspection.id} inspection={inspection} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No completed inspections found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}