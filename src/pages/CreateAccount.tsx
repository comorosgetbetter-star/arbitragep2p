import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Globe, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import SliderCaptcha from '@/components/SliderCaptcha';
import { Checkbox } from '@/components/ui/checkbox';
import OTPVerification from '@/components/OTPVerification';

const accountSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  country: z.string().min(1, 'Please select a country'),
  phone: z.string().min(7, 'Please enter a valid phone number').max(20),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const CreateAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { country: detectedCountry, countries, isLoading: countryLoading } = useCountryDetection();
  
  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  // Get dial code for selected country
  const getCountryInfo = (countryName: string) => {
    return countries.find(c => c.name === countryName);
  };

  const getDialCode = (countryName: string) => {
    return getCountryInfo(countryName)?.dialCode || '';
  };

  // Extract local digits (after dial code) from phone
  const getLocalDigits = (phone: string, countryName: string) => {
    const dialCode = getDialCode(countryName);
    const raw = phone.startsWith(dialCode) ? phone.slice(dialCode.length) : phone;
    return raw.replace(/\D/g, '');
  };

  const validatePhone = (phone: string, countryName: string): string | null => {
    const info = getCountryInfo(countryName);
    if (!info) return null;
    const localDigits = getLocalDigits(phone, countryName);
    if (localDigits.length === 0) return 'Please enter your phone number';
    if (localDigits.length < info.phoneDigits) return `Phone number requires ${info.phoneDigits} digits for ${info.name} (${localDigits.length}/${info.phoneDigits})`;
    if (localDigits.length > info.phoneDigits) return `Phone number too long for ${info.name} — expected ${info.phoneDigits} digits (${localDigits.length}/${info.phoneDigits})`;
    return null;
  };

  // Set detected country when loaded
  useEffect(() => {
    if (detectedCountry && !formData.country) {
      const dialCode = countries.find(c => c.name === detectedCountry)?.dialCode || '';
      setFormData(prev => ({ ...prev, country: detectedCountry, phone: dialCode ? `${dialCode} ` : '' }));
    }
  }, [detectedCountry]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'country') {
        const newDialCode = countries.find(c => c.name === value)?.dialCode || '';
        const oldDialCode = countries.find(c => c.name === prev.country)?.dialCode || '';
        if (oldDialCode && prev.phone.startsWith(oldDialCode)) {
          updated.phone = newDialCode ? `${newDialCode} ${prev.phone.slice(oldDialCode.length).trimStart()}` : prev.phone.slice(oldDialCode.length).trimStart();
        } else if (!prev.phone || prev.phone.trim() === '') {
          updated.phone = newDialCode ? `${newDialCode} ` : '';
        }
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const validatedData = accountSchema.parse(formData);

      // Validate phone digits for selected country
      const phoneError = validatePhone(validatedData.phone, validatedData.country);
      if (phoneError) {
        setErrors(prev => ({ ...prev, phone: phoneError }));
        setIsSubmitting(false);
        return;
      }
      
      // Check if phone number already exists
      const { data: phoneCheckData } = await supabase.functions.invoke('check-phone-exists', {
        body: { phone: validatedData.phone },
      });

      if (phoneCheckData?.exists) {
        setErrors(prev => ({ ...prev, phone: 'This phone number is already registered' }));
        setIsSubmitting(false);
        return;
      }

      // Check if email already exists before sending OTP
      const { data: emailCheckData } = await supabase.functions.invoke('check-email-exists', {
        body: { email: validatedData.email },
      });

      if (emailCheckData?.exists) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in or use a different email.' }));
        setIsSubmitting(false);
        return;
      }

      // Send OTP code via Resend
      const { data, error: sendError } = await supabase.functions.invoke('send-otp', {
        body: { email: validatedData.email, fullName: validatedData.fullName },
      });

      if (sendError || data?.error) {
        toast({
          title: "Failed to send verification code",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Show OTP verification screen
      setShowOTP(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {showOTP ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-bold mb-2">Verify Your Email</h1>
                <p className="text-muted-foreground">
                  Enter the code sent to your email
                </p>
              </div>
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                <OTPVerification
                  email={formData.email}
                  fullName={formData.fullName}
                  phone={formData.phone}
                  country={formData.country}
                  password={formData.password}
                  onVerified={() => navigate('/')}
                  onBack={() => setShowOTP(false)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">
                  Complete your registration to continue with your purchase
                </p>
              </div>

              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={formData.country}
                      onValueChange={(value) => handleChange('country', value)}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder={countryLoading ? "Detecting location..." : "Select country"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-60">
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={getDialCode(formData.country) ? `${getDialCode(formData.country)} xxx xxx xxxx` : "+1 xxx xxx xxxx"}
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  {formData.country && !errors.phone && (() => {
                    const info = getCountryInfo(formData.country);
                    if (!info) return null;
                    const localDigits = getLocalDigits(formData.phone, formData.country);
                    if (localDigits.length === 0) return null;
                    if (localDigits.length === info.phoneDigits) return (
                      <p className="text-xs text-primary">✓ Valid phone number</p>
                    );
                    return (
                      <p className="text-xs text-destructive">Invalid phone number format for {info.name}</p>
                    );
                  })()}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <div>
                      <p className="text-sm text-destructive">{errors.email}</p>
                      {errors.email.includes('already registered') && (
                        <p className="text-xs mt-1">
                          <Link to="/login" className="text-primary hover:underline font-medium">Go to Login</Link>
                        </p>
                      )}
                    </div>
                  )}
                  {!errors.email && formData.email.length > 0 && (() => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                    if (emailRegex.test(formData.email)) return (
                      <p className="text-xs text-primary">✓ Valid email address</p>
                    );
                    return (
                      <p className="text-xs text-destructive">Invalid email format</p>
                    );
                  })()}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  {!errors.confirmPassword && formData.confirmPassword.length > 0 && (() => {
                    if (formData.password === formData.confirmPassword) return (
                      <p className="text-xs text-primary">✓ Passwords match</p>
                    );
                    return (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    );
                  })()}
                </div>

                {/* Slider CAPTCHA */}
                <SliderCaptcha onVerify={setCaptchaVerified} />

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:underline font-medium" target="_blank">Privacy Policy</Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !captchaVerified || !acceptedTerms}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending Verification Code...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateAccount;
