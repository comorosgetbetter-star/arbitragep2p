import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Eye, ChevronLeft, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface KYCSubmission {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  selfie_url: string;
  status: string;
  decline_reason: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface AdminKYCManagerProps {
  members: { user_id: string; full_name: string; email: string }[];
}

export const AdminKYCManager = ({ members }: AdminKYCManagerProps) => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KYCSubmission | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [members]);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const enriched = data.map((s: any) => {
        const member = members.find(m => m.user_id === s.user_id);
        return {
          ...s,
          user_name: member?.full_name || 'Unknown',
          user_email: member?.email || 'Unknown',
        };
      });
      setSubmissions(enriched);
    }
    setLoading(false);
  };

  const openSubmission = async (sub: KYCSubmission) => {
    setSelected(sub);
    // Get signed URLs for the documents
    const [docRes, selfieRes] = await Promise.all([
      supabase.storage.from('kyc-documents').createSignedUrl(sub.document_url, 300),
      supabase.storage.from('kyc-documents').createSignedUrl(sub.selfie_url, 300),
    ]);
    setDocUrl(docRes.data?.signedUrl || null);
    setSelfieUrl(selfieRes.data?.signedUrl || null);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('kyc_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (error) throw error;
      toast.success('KYC approved');
      setSelected(null);
      fetchSubmissions();
    } catch {
      toast.error('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('kyc_submissions')
        .update({
          status: 'declined',
          decline_reason: declineReason || 'Documents not acceptable',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (error) throw error;
      toast.success('KYC declined');
      setSelected(null);
      setShowDeclineDialog(false);
      setDeclineReason('');
      fetchSubmissions();
    } catch {
      toast.error('Failed to decline');
    } finally {
      setProcessing(false);
    }
  };

  const docTypeLabels: Record<string, string> = {
    id: 'National ID',
    dl: "Driver's License",
    passport: 'Passport',
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'declined':
        return <Badge className="bg-destructive/20 text-destructive"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Loading KYC submissions...</div>;
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelected(null); setDocUrl(null); setSelfieUrl(null); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>

        <Card className="border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{selected.user_name}</p>
                <p className="text-xs text-muted-foreground">{selected.user_email}</p>
              </div>
              {statusBadge(selected.status)}
            </div>

            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Document:</span> {docTypeLabels[selected.document_type] || selected.document_type}
              <span className="mx-2">•</span>
              {new Date(selected.created_at).toLocaleDateString()}
            </div>

            {/* Document Image */}
            <div>
              <p className="text-xs font-medium mb-2">Document Photo</p>
              {docUrl ? (
                <img src={docUrl} alt="Document" className="w-full rounded-xl border border-border max-h-64 object-contain bg-secondary/30" />
              ) : (
                <div className="h-32 bg-secondary/30 rounded-xl flex items-center justify-center text-muted-foreground text-xs">Loading...</div>
              )}
            </div>

            {/* Selfie Image */}
            <div>
              <p className="text-xs font-medium mb-2">Selfie Photo</p>
              {selfieUrl ? (
                <img src={selfieUrl} alt="Selfie" className="w-full rounded-xl border border-border max-h-64 object-contain bg-secondary/30" />
              ) : (
                <div className="h-32 bg-secondary/30 rounded-xl flex items-center justify-center text-muted-foreground text-xs">Loading...</div>
              )}
            </div>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => setShowDeclineDialog(true)}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline KYC</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Reason for declining (optional)..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDecline} disabled={processing}>
                {processing ? 'Declining...' : 'Decline KYC'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="text-xs text-amber-400 font-medium">{pendingCount} pending review</div>
      )}
      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No KYC submissions yet</p>
      ) : (
        submissions.map((sub) => (
          <button
            key={sub.id}
            onClick={() => openSubmission(sub)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-medium">{sub.user_name}</p>
              <p className="text-xs text-muted-foreground">
                {docTypeLabels[sub.document_type] || sub.document_type} • {new Date(sub.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(sub.status)}
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))
      )}
    </div>
  );
};
