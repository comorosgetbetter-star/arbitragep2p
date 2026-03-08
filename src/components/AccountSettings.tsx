import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Loader2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  currentEmail: string;
  onEmailUpdated: (newEmail: string) => void;
}

const AccountSettings = ({ currentEmail, onEmailUpdated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) { toast.error('Please enter a valid email'); return; }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      if (user) await supabase.from('profiles').update({ email: newEmail }).eq('user_id', user.id);
      onEmailUpdated(newEmail);
      setEditingEmail(false);
      setNewEmail('');
      toast.success('Email updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update email');
    } finally { setSavingEmail(false); }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setEditingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally { setSavingPassword(false); }
  };

  if (!open) {
    return (
      <div className="glass-card rounded-2xl p-4 mb-6">
        <button onClick={() => setOpen(true)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Account Settings</p>
              <p className="text-xs text-muted-foreground">Change email or password</p>
            </div>
          </div>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Account Settings</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setOpen(false); setEditingEmail(false); setEditingPassword(false); }}>
          <X className="h-3 w-3 mr-1" /> Close
        </Button>
      </div>

      {/* Email */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Email Address</Label>
          {!editingEmail && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditingEmail(true); setNewEmail(currentEmail); }}>
              <Pencil className="h-3 w-3 mr-1" /> Change
            </Button>
          )}
        </div>
        {editingEmail ? (
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" className="pl-10" type="email" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="glow" onClick={handleUpdateEmail} disabled={savingEmail} className="flex-1">
                {savingEmail ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingEmail(false); setNewEmail(''); }} className="flex-1">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium pl-1">{currentEmail}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Password</Label>
          {!editingPassword && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingPassword(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Change
            </Button>
          )}
        </div>
        {editingPassword ? (
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" type={showPassword ? 'text' : 'password'} className="pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" type={showPassword ? 'text' : 'password'} className="pl-10" />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
            {newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
              <p className="text-xs text-primary">✓ Passwords match</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="glow" onClick={handleUpdatePassword} disabled={savingPassword} className="flex-1">
                {savingPassword ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingPassword(false); setNewPassword(''); setConfirmPassword(''); }} className="flex-1">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium pl-1">••••••••</p>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
