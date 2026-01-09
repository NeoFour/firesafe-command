import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Flame,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  MapPin,
  QrCode,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface NocResult {
  valid: boolean;
  number: string;
  building: string;
  category: string;
  address: string;
  issuedTo: string;
  issueDate: string;
  validFrom: string;
  validUntil: string;
  status: string;
  conditions: string[];
}

export default function VerifyNOC() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<NocResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    const normalizedQuery = searchQuery.trim().toUpperCase();
    if (!normalizedQuery) return;

    setIsLoading(true);
    setHasSearched(true);
    setNotFound(false);
    setSearchResult(null);

    try {
      // Query the real NOCs table - public access for verification
      const { data: noc, error } = await supabase
        .from('nocs')
        .select(`
          noc_number,
          status,
          issued_to,
          issue_date,
          valid_from,
          valid_until,
          conditions,
          buildings (
            name,
            category,
            address
          )
        `)
        .eq('noc_number', normalizedQuery)
        .single();

      if (error || !noc) {
        setNotFound(true);
        return;
      }

      const building = noc.buildings as { name: string; category: string; address: string } | null;
      const isValid = noc.status === 'active' && new Date(noc.valid_until) > new Date();

      setSearchResult({
        valid: isValid,
        number: noc.noc_number,
        building: building?.name || 'Unknown Building',
        category: building?.category || 'unknown',
        address: building?.address || 'Address not available',
        issuedTo: noc.issued_to,
        issueDate: new Date(noc.issue_date).toLocaleDateString(),
        validFrom: new Date(noc.valid_from).toLocaleDateString(),
        validUntil: new Date(noc.valid_until).toLocaleDateString(),
        status: isValid ? 'active' : 'expired',
        conditions: Array.isArray(noc.conditions) ? noc.conditions as string[] : []
      });
    } catch (err) {
      console.error('Error searching NOC:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">Fire Safety</h1>
              <p className="text-xs text-muted-foreground">Monitoring System</p>
            </div>
          </Link>
          {user ? (
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Fire Safety NOC</h1>
            <p className="text-muted-foreground">
              Enter the NOC number or scan the QR code to verify the authenticity of a Fire Safety Certificate
            </p>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter NOC Number (e.g., NOC-20250103-0001)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} className="gap-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Verify
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
              <Button variant="outline" className="w-full mt-4 gap-2">
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {hasSearched && searchResult && (
            <Card className={searchResult.valid ? 'border-success/50' : 'border-destructive/50'}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {searchResult.valid ? (
                    <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                  )}
                  <div>
                    <CardTitle className={searchResult.valid ? 'text-success' : 'text-destructive'}>
                      {searchResult.valid ? 'Valid NOC Certificate' : 'NOC Expired'}
                    </CardTitle>
                    <CardDescription>
                      {searchResult.valid 
                        ? 'This certificate is authentic and currently valid'
                        : 'This certificate has expired and is no longer valid'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">NOC Number</p>
                    <p className="font-medium">{searchResult.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={searchResult.valid ? 'default' : 'destructive'} className="capitalize">
                      {searchResult.status}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{searchResult.building}</p>
                    <Badge variant="outline" className="capitalize text-xs mt-1">
                      {searchResult.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{searchResult.address}</p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Issued To</p>
                    <p className="font-medium">{searchResult.issuedTo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{searchResult.issueDate}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid From</p>
                    <p>{searchResult.validFrom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className={!searchResult.valid ? 'text-destructive font-medium' : ''}>
                      {searchResult.validUntil}
                    </p>
                  </div>
                </div>

                {searchResult.conditions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">Conditions</p>
                      <ul className="space-y-1">
                        {searchResult.conditions.map((condition, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {hasSearched && notFound && (
            <Card className="border-destructive/50">
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive mb-2">NOC Not Found</h3>
                <p className="text-muted-foreground">
                  No NOC certificate found with the number "{searchQuery}". Please check the number and try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Hint */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Enter the NOC number from your certificate to verify its authenticity.
            <br />
            Example format: <code className="bg-muted px-2 py-1 rounded">NOC-XXXXXXXX-XXXX</code>
          </p>
        </div>
      </main>
    </div>
  );
}