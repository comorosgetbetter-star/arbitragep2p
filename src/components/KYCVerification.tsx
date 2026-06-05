import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Upload, Camera, CheckCircle2, XCircle, Clock, FileText, ChevronRight, ChevronLeft, Globe } from 'lucide-react';

type DocType = 'id' | 'dl' | 'passport';

interface KYCSubmission {
  id: string;
  document_type: string;
  status: string;
  decline_reason: string | null;
  created_at: string;
}

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Tanzania', 'Uganda', 'Cameroon',
  'United States', 'United Kingdom', 'Canada', 'India', 'Pakistan', 'Bangladesh',
  'Philippines', 'Indonesia', 'Brazil', 'Mexico', 'Egypt', 'Ethiopia', 'Rwanda',
  'Senegal', 'Zambia', 'Zimbabwe', 'Mozambique', 'Angola', 'DR Congo', 'Other',
];

const KYCVerification = () => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'country' | 'doctype' | 'upload'>('country');
  const [country, setCountry] = useState('');
  const [docType, setDocType] = useState<DocType>('id');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [kycRes, profileRes] = await Promise.all([
      supabase.from('kyc_submissions').select('id, document_type, status, decline_reason, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('country').eq('user_id', user.id).single(),
    ]);
    setSubmission(kycRes.data);
    if (profileRes.data?.country) setCountry(profileRes.data.country);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    if (type === 'doc') { setDocFile(file); setDocPreview(URL.createObjectURL(file)); }
    else { setSelfieFile(file); setSelfiePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    if (!user || !docFile || !selfieFile) { toast.error('Please upload both document and selfie'); return; }
    setSubmitting(true);
    try {
      const ts = Date.now();
      const docPath = `${user.id}/doc-${ts}.${docFile.name.split('.').pop()}`;
      const selfiePath = `${user.id}/selfie-${ts}.${selfieFile.name.split('.').pop()}`;
      const [d, s] = await Promise.all([
        supabase.storage.from('kyc-documents').upload(docPath, docFile),
        supabase.storage.from('kyc-documents').upload(selfiePath, selfieFile),
      ]);
      if (d.error) throw d.error;
      if (s.error) throw s.error;
      const { error } = await supabase.from('kyc_submissions').insert({
        user_id: user.id, document_type: docType, document_url: docPath, selfie_url: selfiePath,
      });
      if (error) throw error;

      // Fire-and-forget Telegram notification
      const { data: prof } = await supabase.from('profiles').select('full_name, email').eq('user_id', user.id).maybeSingle();
      supabase.functions.invoke('send-telegram-notification', {
        body: {
          event: 'kyc_submitted',
          details: {
            user_name: prof?.full_name || 'Unknown',
            user_email: prof?.email || user.email || '',
            document_type: docType,
          },
        },
      }).catch(() => {});

      toast.success('KYC documents submitted for review');
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('KYC submit error:', err);
      toast.error('Failed to submit KYC documents');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setOpen(false); setStep('country'); setDocFile(null); setSelfieFile(null);
    setDocPreview(null); setSelfiePreview(null);
  };

  if (loading) return <div className="glass-card rounded-2xl p-4 mb-6 animate-pulse h-14" />;

  // Approved
  if (submission?.status === 'approved') {
    return (
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <p className="font-semibold text-sm">KYC Verified</p>
          <p className="text-xs text-muted-foreground">Your identity has been verified</p>
        </div>
      </div>
    );
  }

  // Pending
  if (submission?.status === 'pending') {
    return (
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-sm">KYC Under Review</p>
          <p className="text-xs text-muted-foreground">Your documents are being reviewed</p>
        </div>
      </div>
    );
  }

  // Declined - show button to re-submit
  const isDeclined = submission?.status === 'declined';

  if (!open) {
    return (
      <div className="glass-card rounded-2xl p-4 mb-6">
        {isDeclined && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{submission?.decline_reason || 'Your KYC was declined. Please re-submit.'}</p>
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{isDeclined ? 'Re-submit KYC' : 'Complete Your KYC'}</p>
              <p className="text-xs text-muted-foreground">Verify your identity to unlock full features</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  const docTypeLabels: Record<DocType, string> = { id: 'National ID', dl: "Driver's License", passport: 'Passport' };
  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
    : COUNTRIES;

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => step === 'country' ? resetForm() : setStep(step === 'upload' ? 'doctype' : 'country')}
          className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold">
          {step === 'country' ? 'Select Your Country' : step === 'doctype' ? 'Choose Document Type' : 'Upload Documents'}
        </h2>
      </div>

      {/* Step 1: Country */}
      {step === 'country' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search country..."
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
            {filteredCountries.map((c) => (
              <button key={c} onClick={() => setCountry(c)}
                className={`p-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                  country === c ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
                }`}>
                <Globe className="h-3.5 w-3.5 inline mr-1.5" />{c}
              </button>
            ))}
          </div>
          <Button onClick={() => { if (!country) { toast.error('Please select a country'); return; } setStep('doctype'); }}
            className="w-full" size="lg">
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Document Type */}
      {step === 'doctype' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(docTypeLabels) as DocType[]).map((type) => (
              <button key={type} onClick={() => setDocType(type)}
                className={`p-4 rounded-xl text-left text-sm font-medium transition-all border flex items-center gap-3 ${
                  docType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
                }`}>
                <FileText className="h-5 w-5" />
                {docTypeLabels[type]}
              </button>
            ))}
          </div>
          <Button onClick={() => setStep('upload')} className="w-full" size="lg">Continue</Button>
        </div>
      )}

      {/* Step 3: Upload */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload {docTypeLabels[docType]}</Label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
              {docPreview ? (
                <img src={docPreview} alt="Document" className="h-full w-full object-contain rounded-xl p-2" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Upload className="h-5 w-5" /><span className="text-xs">Tap to upload document photo</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'doc')} />
            </label>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload a Photo of Your Face</Label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
              {selfiePreview ? (
                <img src={selfiePreview} alt="Selfie" className="h-full w-full object-contain rounded-xl p-2" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Camera className="h-5 w-5" /><span className="text-xs">Tap to upload selfie</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'selfie')} />
            </label>
          </div>
          <Button onClick={handleSubmit} disabled={!docFile || !selfieFile || submitting}
            className="w-full" variant="glow" size="lg">
            {submitting ? 'Submitting...' : 'Submit KYC Documents'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
