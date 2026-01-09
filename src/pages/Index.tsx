import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Flame,
  Shield,
  Clock,
  FileCheck,
  ArrowRight,
  Building2,
  BarChart3,
  QrCode
} from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: FileCheck,
      title: 'Online Applications',
      description: 'Submit NOC applications digitally with real-time tracking'
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Streamlined workflow for quick approvals'
    },
    {
      icon: Shield,
      title: 'Verified NOCs',
      description: 'QR code verification for authentic certificates'
    },
    {
      icon: BarChart3,
      title: 'AI-Powered Analytics',
      description: 'Predictive risk assessment and insights'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">Fire Safety</h1>
              <p className="text-xs text-muted-foreground">Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/verify">
              <Button variant="ghost" size="sm" className="gap-2">
                <QrCode className="h-4 w-4" />
                Verify NOC
              </Button>
            </Link>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6">
            <Flame className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Modern Fire Safety<br />Compliance Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Apply for NOCs, track inspections, and ensure fire safety compliance with our 
            smart, paperless, and transparent digital platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/verify">
              <Button size="lg" variant="outline" className="gap-2">
                <Shield className="h-5 w-5" />
                Verify NOC
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Create an account and submit your first application today.
          </p>
          <Link to="/auth">
            <Button size="lg">Create Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Fire Department. All rights reserved.
        </div>
      </footer>
    </div>
  );
}