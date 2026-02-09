import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  Network, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Users,
      title: 'Connect with Alumni',
      description: 'Build meaningful relationships with graduates who share your background.',
    },
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      description: 'Discover job openings and get referrals from your network.',
    },
    {
      icon: Network,
      title: 'Stay Connected',
      description: 'Keep in touch with classmates and track their professional journey.',
    },
  ];

  const benefits = [
    'Access to exclusive alumni directory',
    'Career mentorship opportunities',
    'Networking events and reunions',
    'Job board with alumni referrals',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Alumni Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute top-40 left-10 w-72 h-72 rounded-full bg-secondary/20 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            Connecting graduates worldwide
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Your Alumni Network,{' '}
            <span className="text-transparent bg-clip-text gradient-accent">
              Reimagined
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Connect with fellow alumni, discover career opportunities, and stay connected 
            with your alma mater through our comprehensive tracking platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="gap-2">
                Join Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="xl">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Stay Connected
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform provides all the tools you need to maintain and grow your professional network.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="p-8 rounded-2xl bg-card shadow-soft hover:shadow-elevated transition-shadow duration-300 animate-fade-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="p-3 rounded-xl gradient-primary w-fit mb-6">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Join Our Alumni Network?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Be part of a thriving community that supports each other's growth and success.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li 
                    key={benefit}
                    className="flex items-center gap-3 animate-fade-up"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-block mt-8">
                <Button variant="hero" size="lg" className="gap-2">
                  Get Started Today <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl gradient-hero p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i}
                      className="aspect-square rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center animate-float"
                      style={{ animationDelay: `${i * 0.5}s` }}
                    >
                      <GraduationCap className="w-8 h-8 text-primary-foreground/60" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-secondary shadow-elevated flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <Users className="w-10 h-10 text-secondary-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-hero">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Connect with Your Network?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Join thousands of alumni and students already using our platform.
          </p>
          <Link to="/auth">
            <Button 
              size="xl" 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
            >
              Create Your Account <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold">Alumni Tracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Alumni Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
