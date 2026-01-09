import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  Star,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Grievance = Tables<'grievances'>;

const statusConfig = {
  submitted: { label: 'Submitted', className: 'bg-info/15 text-info border-info/30' },
  under_review: { label: 'Under Review', className: 'bg-warning/15 text-warning border-warning/30' },
  resolved: { label: 'Resolved', className: 'bg-success/15 text-success border-success/30' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-muted' },
};

const categories = [
  'Processing Delay',
  'Inspection Issue',
  'Communication',
  'Technical Issue',
  'Staff Behavior',
  'Document Issue',
  'Other'
];

export default function Grievances() {
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [category, setCategory] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  
  const isStaff = roles.some(r => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchGrievances();
    }
  }, [user, isStaff]);

  const fetchGrievances = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('grievances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrievances(data || []);
    } catch (err: any) {
      console.error('Error fetching grievances:', err);
      toast.error('Failed to load grievances');
    } finally {
      setIsFetching(false);
    }
  };

  const generateGrievanceNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `GRV-${dateStr}-${random}`;
  };

  const handleSubmit = async () => {
    if (!category || !subject || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit a grievance');
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedApplicationId: string | null = null;

      // If applicationId looks like it's an application number, try to find the actual ID
      if (applicationId && applicationId.startsWith('APP-')) {
        const { data: appData } = await supabase
          .from('applications')
          .select('id')
          .eq('application_number', applicationId)
          .single();
        
        if (appData) {
          resolvedApplicationId = appData.id;
        }
      }

      const grievanceData = {
        grievance_number: generateGrievanceNumber(),
        category,
        subject,
        description,
        submitted_by: user.id,
        application_id: resolvedApplicationId,
        status: 'submitted' as const,
      };

      const { error } = await supabase
        .from('grievances')
        .insert(grievanceData);

      if (error) throw error;

      toast.success('Grievance submitted successfully');
      setIsDialogOpen(false);
      
      // Reset form
      setCategory('');
      setApplicationId('');
      setSubject('');
      setDescription('');
      
      // Refresh list
      fetchGrievances();
    } catch (err: any) {
      console.error('Error submitting grievance:', err);
      toast.error(err.message || 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  const filteredGrievances = grievances.filter(g => 
    g.grievance_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeGrievances = filteredGrievances.filter(g => g.status === 'submitted' || g.status === 'under_review');
  const closedGrievances = filteredGrievances.filter(g => g.status === 'resolved' || g.status === 'closed');

  const GrievanceCard = ({ grievance }: { grievance: Grievance }) => {
    const config = statusConfig[grievance.status];

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono text-sm text-muted-foreground">{grievance.grievance_number}</p>
              <h3 className="font-medium mt-1">{grievance.subject}</h3>
            </div>
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <Badge variant="secondary">{grievance.category}</Badge>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {grievance.application_id && (
            <p className="text-xs text-muted-foreground">
              Related Application: <span className="text-primary">{grievance.application_id.slice(0, 8)}...</span>
            </p>
          )}

          {(grievance.status === 'resolved' || grievance.status === 'closed') && grievance.rating && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= grievance.rating! ? 'text-warning fill-warning' : 'text-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Grievances</h1>
            <p className="text-muted-foreground mt-1">
              {isStaff ? 'Manage citizen complaints and feedback' : 'Submit and track your complaints'}
            </p>
          </div>
          {!isStaff && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Grievance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Submit a Grievance</DialogTitle>
                  <DialogDescription>
                    Please provide details about your complaint or feedback.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="application">Related Application (Optional)</Label>
                    <Input 
                      id="application" 
                      placeholder="e.g., APP-20250102-0008" 
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input 
                      id="subject" 
                      placeholder="Brief description of your issue" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your complaint..."
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Submit Grievance
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by grievance number or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isFetching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Tabs */}
        {!isFetching && (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active" className="gap-2">
                <Clock className="h-4 w-4" />
                Active ({activeGrievances.length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Closed ({closedGrievances.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeGrievances.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeGrievances.map((grievance) => (
                    <GrievanceCard key={grievance.id} grievance={grievance} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active grievances.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="closed">
              {closedGrievances.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {closedGrievances.map((grievance) => (
                    <GrievanceCard key={grievance.id} grievance={grievance} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No closed grievances.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
