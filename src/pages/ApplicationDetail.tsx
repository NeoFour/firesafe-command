import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { ApplicationTimeline } from '@/components/dashboard/ApplicationTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  MapPin,
  FileText,
  Download,
  Printer,
  Award,
  Clock,
  Camera,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ApplicationDetailRow = {
  id: string;
  application_number: string;
  applicant_id: string;
  application_type: string;
  status: any;
  purpose: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  documents: any;
  buildings: null | {
    id: string;
    name: string;
    category: any;
    address: string;
    city: string;
    state: string;
    pincode: string;
    floors: number;
    area_sqft: number;
    occupancy_capacity: number | null;
    year_built: number | null;
    risk_score: number | null;
    risk_level: any | null;
  };
};

type ApplicantProfile = {
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  address: string | null;
};

type NocRecord = {
  id: string;
  noc_number: string;
  valid_from: string;
  valid_until: string;
  status: string;
  issue_date: string;
};

type InspectionRecord = {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  officer_id: string | null;
  photos: string[] | null;
  findings: string | null;
  recommendations: string | null;
  overall_score: number | null;
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user, isLoading, roles } = useAuth();
  const navigate = useNavigate();

  const isStaff = roles.some((r) => ['fire_officer', 'senior_officer', 'admin'].includes(r));

  const [app, setApp] = useState<ApplicationDetailRow | null>(null);
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [noc, setNoc] = useState<NocRecord | null>(null);
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [inspectionPhotoUrls, setInspectionPhotoUrls] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user || !id) return;

    const load = async () => {
      setIsFetching(true);
      setNotFound(false);

      try {
        const { data, error } = await supabase
          .from('applications')
          .select(
            'id, application_number, applicant_id, application_type, status, purpose, notes, submitted_at, created_at, documents, buildings(id, name, category, address, city, state, pincode, floors, area_sqft, occupancy_capacity, year_built, risk_score, risk_level)'
          )
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setNotFound(true);
          setApp(null);
          return;
        }

        const row = data as ApplicationDetailRow;
        setApp(row);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, phone, organization, address')
          .eq('user_id', row.applicant_id)
          .maybeSingle();

        setProfile((profileData ?? null) as ApplicantProfile | null);

        // Fetch inspection if scheduled or completed
        if (['inspection_scheduled', 'inspection_completed', 'approved', 'rejected'].includes(row.status)) {
          const { data: inspectionData } = await supabase
            .from('inspections')
            .select('id, scheduled_date, scheduled_time, status, officer_id, photos, findings, recommendations, overall_score')
            .eq('application_id', row.id)
            .maybeSingle();
          
          const inspRecord = (inspectionData ?? null) as InspectionRecord | null;
          setInspection(inspRecord);

          // Set inspection photos - they're stored as full URLs
          if (inspRecord?.photos && Array.isArray(inspRecord.photos) && inspRecord.photos.length > 0) {
            // Photos are already full URLs, use them directly
            setInspectionPhotoUrls(inspRecord.photos);
          }
        }

        // Fetch NOC if application is approved
        if (row.status === 'approved') {
          const { data: nocData } = await supabase
            .from('nocs')
            .select('id, noc_number, valid_from, valid_until, status, issue_date')
            .eq('application_id', row.id)
            .maybeSingle();
          
          setNoc((nocData ?? null) as NocRecord | null);
        }
      } catch (err: any) {
        console.error('Failed to load application:', err);
        toast.error(err?.message || 'Failed to load application');
        setNotFound(true);
        setApp(null);
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, [id, user]);

  const submittedLabel = useMemo(() => {
    if (!app) return '';
    const dt = new Date(app.submitted_at ?? app.created_at);
    return dt.toLocaleDateString();
  }, [app]);

  const generateNOCContent = () => {
    if (!noc || !app || !building) return '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Fire Safety NOC Certificate - ${noc.noc_number}</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #b91c1c; }
    .title { font-size: 28px; font-weight: bold; margin: 15px 0; color: #1a1a1a; }
    .subtitle { font-size: 14px; color: #666; }
    .certificate-body { line-height: 1.8; }
    .noc-number { font-size: 20px; font-weight: bold; color: #b91c1c; text-align: center; margin: 20px 0; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .detail-item { padding: 10px; background: #f9fafb; border-left: 3px solid #b91c1c; }
    .detail-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .detail-value { font-size: 14px; font-weight: bold; margin-top: 5px; }
    .validity { text-align: center; margin: 30px 0; padding: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; }
    .validity-title { font-size: 12px; color: #065f46; text-transform: uppercase; }
    .validity-dates { font-size: 16px; font-weight: bold; color: #065f46; margin-top: 5px; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    .seal { width: 100px; height: 100px; border: 2px solid #b91c1c; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 20px 0; color: #b91c1c; font-weight: bold; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔥 Fire Safety Department</div>
    <div class="title">NO OBJECTION CERTIFICATE</div>
    <div class="subtitle">Issued under Fire Safety Regulations</div>
  </div>
  
  <div class="noc-number">NOC No: ${noc.noc_number}</div>
  
  <div class="certificate-body">
    <p>This is to certify that the building described below has been inspected and found to comply with the fire safety standards and regulations as prescribed by the Fire Safety Department.</p>
    
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Building Name</div>
        <div class="detail-value">${building.name}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Category</div>
        <div class="detail-value">${String(building.category).replace('_', ' ').toUpperCase()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Address</div>
        <div class="detail-value">${building.address}, ${building.city}, ${building.state} - ${building.pincode}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Application Number</div>
        <div class="detail-value">${app.application_number}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Total Floors</div>
        <div class="detail-value">${building.floors}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Built-up Area</div>
        <div class="detail-value">${building.area_sqft.toLocaleString()} sq.ft</div>
      </div>
    </div>
    
    <div class="validity">
      <div class="validity-title">Certificate Validity Period</div>
      <div class="validity-dates">${new Date(noc.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} to ${new Date(noc.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    
    <p style="margin-top: 30px;">This certificate is issued subject to the condition that the fire safety measures and equipment installed in the building are maintained in proper working condition at all times.</p>
  </div>
  
  <div style="text-align: center; margin-top: 40px;">
    <div class="seal">APPROVED</div>
    <p style="font-size: 12px; color: #666;">Issue Date: ${new Date(noc.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  
  <div class="footer">
    <p>This is a digitally generated certificate. Verify authenticity at the official portal.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
  };

  const handleDownloadNOC = () => {
    if (!noc) return;
    
    const content = generateNOCContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NOC-Certificate-${noc.noc_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Certificate downloaded successfully');
  };

  const handlePrintNOC = () => {
    if (!noc) return;
    
    const content = generateNOCContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (isLoading || !user) return null;

  if (isFetching && !app && !notFound) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center text-muted-foreground">Loading application…</div>
      </DashboardLayout>
    );
  }

  if (notFound || !app) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Application not found</h1>
              <p className="text-muted-foreground mt-1">
                This application may not exist or you may not have access to it.
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Button onClick={() => navigate('/applications')}>Back to Applications</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const building = app.buildings;
  const riskLevel = (building?.risk_level ?? 'medium') as any;
  const riskScore = building?.risk_score ?? undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{app.application_number}</h1>
                <StatusBadge status={app.status as any} />
              </div>
              <p className="text-muted-foreground">
                {app.application_type} • Submitted on {submittedLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* NOC Certificate Card - Show when approved */}
        {app.status === 'approved' && noc && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <Award className="h-5 w-5" />
                NOC Certificate Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">NOC Number</p>
                  <p className="text-lg font-bold text-green-800 dark:text-green-300">{noc.noc_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                  <p className="text-sm">{new Date(noc.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid From</p>
                  <p className="text-sm">{new Date(noc.valid_from).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                  <p className="text-sm">{new Date(noc.valid_until).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDownloadNOC()}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePrintNOC()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspection Schedule Card - Show when inspection is scheduled */}
        {inspection && ['inspection_scheduled', 'inspection_completed'].includes(app.status) && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Calendar className="h-5 w-5" />
                Inspection {app.status === 'inspection_completed' ? 'Completed' : 'Scheduled'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(inspection.scheduled_date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {inspection.scheduled_time && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time Slot</p>
                      <p className="text-lg font-semibold">{inspection.scheduled_time}</p>
                    </div>
                  </div>
                )}
              </div>
              {app.status === 'inspection_scheduled' && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Please ensure the building is accessible and all fire safety equipment is available for inspection.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Inspection Photos & Results - Show when inspection is completed */}
        {inspection && app.status === 'inspection_completed' && inspectionPhotoUrls.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Inspection Photos
              </CardTitle>
              <CardDescription>
                Photos taken during the site inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {inspectionPhotoUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={url}
                      alt={`Inspection photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </a>
                ))}
              </div>

              {/* Inspection Results Summary */}
              {(inspection.findings || inspection.recommendations || inspection.overall_score !== null) && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  
                  {inspection.overall_score !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Overall Score:</span>
                      <Badge variant={inspection.overall_score >= 70 ? 'default' : 'destructive'}>
                        {inspection.overall_score}/100
                      </Badge>
                    </div>
                  )}

                  {inspection.findings && (
                    <div>
                      <p className="text-sm font-medium mb-1">Findings</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inspection.findings}</p>
                    </div>
                  )}

                  {inspection.recommendations && (
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendations</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inspection.recommendations}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Progress */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTimeline currentStatus={app.status as any} />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            {isStaff && <TabsTrigger value="actions">Actions</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Building Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Building Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{building?.name ?? 'Unknown building'}</h3>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {String(building?.category ?? 'other')}
                      </Badge>
                    </div>
                    <RiskBadge level={riskLevel} score={riskScore} />
                  </div>

                  <Separator />

                  <div className="grid gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {building?.address ?? '—'}
                          <br />
                          {building?.city ?? '—'}, {building?.state ?? '—'} - {building?.pincode ?? '—'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Floors</p>
                        <p className="text-sm text-muted-foreground">{building?.floors ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Area</p>
                        <p className="text-sm text-muted-foreground">
                          {building?.area_sqft ? `${Number(building.area_sqft).toLocaleString()} sq.ft` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Occupancy</p>
                        <p className="text-sm text-muted-foreground">
                          {building?.occupancy_capacity ? `${building.occupancy_capacity.toLocaleString()} people` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Year Built</p>
                        <p className="text-sm text-muted-foreground">{building?.year_built ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Applicant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Applicant Information
                  </CardTitle>
                  <CardDescription>
                    {isStaff ? `Applicant ID: ${app.applicant_id}` : 'Your account details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{profile?.full_name ?? '—'}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.organization ?? '—'}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm">{profile?.email ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm">{profile?.phone ?? '—'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground">Address:</span>
                      <span className="text-sm">{profile?.address ?? '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purpose */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Purpose
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{app.purpose || '—'}</p>
                {app.notes && (
                  <div>
                    <p className="text-sm font-medium">Additional Notes</p>
                    <p className="text-sm text-muted-foreground mt-1">{app.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                <CardDescription>Documents submitted with this application</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(app.documents) && app.documents.length > 0 ? (
                  <div className="space-y-2">
                    {app.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc?.name ?? `Document ${idx + 1}`}</p>
                            {doc?.size && <p className="text-xs text-muted-foreground">{doc.size}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isStaff && (
            <TabsContent value="actions">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Officer Actions</CardTitle>
                  <CardDescription>Workflow actions will appear here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Coming next: assign officer, schedule inspection, approve/reject.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
