import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  Link as LinkIcon,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  graduation_year: number | null;
  department: string | null;
  current_company: string | null;
  current_position: string | null;
  linkedin_url: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'alumni' | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData) {
      setUserRole(roleData.role as 'student' | 'alumni');
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setDepartment(data.department || '');
      setGraduationYear(data.graduation_year?.toString() || '');
      setCurrentCompany(data.current_company || '');
      setCurrentPosition(data.current_position || '');
      setLinkedinUrl(data.linkedin_url || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        department: department || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        current_company: currentCompany || null,
        current_position: currentPosition || null,
        linkedin_url: linkedinUrl || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
    }
    setIsSaving(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const roleColor = userRole === 'alumni' ? 'amber' : 'blue';
  const roleGradient = userRole === 'alumni' 
    ? 'from-amber-500 to-orange-600' 
    : 'from-blue-500 to-indigo-600';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-${roleColor}-50/30`}>
      {/* Header */}
      <header className="border-b glass-effect sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={`p-2 rounded-xl bg-gradient-to-br ${roleGradient} shadow-lg`}>
              <User className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg hidden sm:inline bg-gradient-to-r ${userRole === 'alumni' ? 'from-amber-600 to-orange-600' : 'from-blue-600 to-indigo-600'} bg-clip-text text-transparent`}>
              Profile Settings
            </span>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`bg-gradient-to-r ${roleGradient} hover:opacity-90`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Avatar Section */}
        <Card className="mb-6 shadow-elevated overflow-hidden">
          <div className={`h-24 bg-gradient-to-r ${roleGradient}`} />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-4 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className={`text-xl bg-gradient-to-br ${roleGradient} text-white`}>
                  {getInitials(fullName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left mt-2 sm:mt-8">
                <h2 className="text-2xl font-bold">{fullName || 'Your Name'}</h2>
                <p className="text-muted-foreground capitalize">{userRole || 'User'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mb-6 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update your personal information visible to others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Info */}
        <Card className="mb-6 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              Academic Information
            </CardTitle>
            <CardDescription>
              Your educational background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="graduationYear"
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2024"
                    className="pl-10"
                    min="1950"
                    max="2030"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info - Only for Alumni */}
        {userRole === 'alumni' && (
          <Card className="mb-6 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                Professional Information
              </CardTitle>
              <CardDescription>
                Your current work details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="currentCompany"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="Google, Microsoft, etc."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPosition">Current Position</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="currentPosition"
                      value={currentPosition}
                      onChange={(e) => setCurrentPosition(e.target.value)}
                      placeholder="Software Engineer"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="linkedinUrl"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button (Mobile) */}
        <div className="sm:hidden">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`w-full bg-gradient-to-r ${roleGradient} hover:opacity-90`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
