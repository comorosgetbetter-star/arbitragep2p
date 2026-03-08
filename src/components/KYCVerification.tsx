import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Upload, Camera, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

type DocType = 'id' | 'dl' | 'passport';

interface KYCSubmission {
  id: string;
  document_type: string;
  status: string;
  decline_reason: string | null;
  created_at: string;
}

const KYCVerification = () => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType] = useState<DocType>('id');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSubmission();
  }, [user]);

  const fetchSubmission = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('kyc_submissions')
      .select('id, document_type, status, decline_reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubmission(data);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    if (type === 'doc') {
      setDocFile(file);
      setDocPreview(URL.createObjectURL(file));
    } else {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !docFile || !selfieFile) {
      toast.error('Please upload both document and selfie');
      return;
    }

    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const docPath = `${user.id}/doc-${timestamp}.${docFile.name.split('.').pop()}`;
      const selfiePath = `${user.id}/selfie-${timestamp}.${selfieFile.name.split('.').pop()}`;

      const [docUpload, selfieUpload] = await Promise.all([
        supabase.storage.from('kyc-documents').upload(docPath, docFile),
        supabase.storage.from('kyc-documents').upload(selfiePath, selfieFile),
      ]);

      if (docUpload.error) throw docUpload.error;
      if (selfieUpload.error) throw selfieUpload.error;

      const { error } = await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        document_type: docType,
        document_url: docPath,
        selfie_url: selfiePath,
      });

      if (error) throw error;

      toast.success('KYC documents submitted for review');
      setDocFile(null);
      setSelfieFile(null);
      setDocPreview(null);
      setSelfiePreview(null);
      fetchSubmission();
    } catch (err: any) {
      console.error('KYC submit error:', err);
      toast.error('Failed to submit KYC documents');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="animate-pulse h-20 bg-secondary/50 rounded-xl" />
      </div>
    );
  }

  // Status display
  if (submission && submission.status === 'approved') {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold">KYC Verified</h2>
            <p className="text-sm text-muted-foreground">Your identity has been verified successfully</p>
          </div>
        </div>
      </div>
    );
  }

  if (submission && submission.status === 'pending') {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold">KYC Under Review</h2>
            <p className="text-sm text-muted-foreground">Your documents are being reviewed. This may take up to 24 hours.</p>
          </div>
        </div>
      </div>
    );
  }

  if (submission && submission.status === 'declined') {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold">KYC Declined</h2>
            <p className="text-sm text-muted-foreground">
              {submission.decline_reason || 'Your documents were not approved. Please re-submit.'}
            </p>
          </div>
        </div>
        {/* Show form again for re-submission */}
        {renderForm()}
      </div>
    );
  }

  // No submission yet
  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold">Complete Your KYC</h2>
          <p className="text-sm text-muted-foreground">Verify your identity to unlock full features</p>
        </div>
      </div>
      {renderForm()}
    </div>
  );

  function renderForm() {
    const docTypeLabels: Record<DocType, string> = {
      id: 'National ID',
      dl: "Driver's License",
      passport: 'Passport',
    };

    return (
      <div className="space-y-5">
        {/* Document Type Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Select Document Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(docTypeLabels) as DocType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDocType(type)}
                className={`p-3 rounded-xl text-center text-xs font-medium transition-all border ${
                  docType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <FileText className="h-5 w-5 mx-auto mb-1" />
                {docTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Document Upload */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Upload {docTypeLabels[docType]}
          </Label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
            {docPreview ? (
              <img src={docPreview} alt="Document" className="h-full w-full object-contain rounded-xl p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-xs">Tap to upload document photo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'doc')}
            />
          </label>
        </div>

        {/* Selfie Upload */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Upload a Photo of Your Face</Label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Selfie" className="h-full w-full object-contain rounded-xl p-2" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-6 w-6" />
                <span className="text-xs">Tap to upload selfie</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'selfie')}
            />
          </label>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!docFile || !selfieFile || submitting}
          className="w-full"
          variant="glow"
          size="lg"
        >
          {submitting ? 'Submitting...' : 'Submit KYC Documents'}
        </Button>
      </div>
    );
  }
};

export default KYCVerification;
