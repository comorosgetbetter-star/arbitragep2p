import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Building2, Shield, Check, Copy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface PackageData {
  usd: number;
  usdt: number;
  isCustom?: boolean;
}

const Payment = () => {
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = sessionStorage.getItem('user');
    if (!user) {
      navigate('/create-account');
      return;
    }

    // Get selected package
    const storedPackage = sessionStorage.getItem('selectedPackage');
    if (storedPackage) {
      setPackageData(JSON.parse(storedPackage));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Payment Successful!",
      description: `You have purchased ${packageData?.usdt} USDT successfully.`,
    });
    
    // Clear selected package and redirect
    sessionStorage.removeItem('selectedPackage');
    navigate('/');
    setIsProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  if (!packageData) {
    return null;
  }

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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Complete Payment</h1>
            <p className="text-muted-foreground">
              Choose your preferred payment method to complete the purchase
            </p>
          </div>

          <div className="grid gap-6">
            {/* Order Summary */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium">
                  {packageData.isCustom ? 'Custom Package' : 'Express P2P Package'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">You Pay</span>
                <span className="font-display font-bold text-lg">${packageData.usd.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">You Receive</span>
                <span className="font-display font-bold text-lg text-primary">{packageData.usdt.toLocaleString()} USDT</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Card</p>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bank' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Building2 className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'bank' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Bank</p>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'crypto' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Wallet className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'crypto' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Crypto</p>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input placeholder="123" type="password" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input placeholder="John Doe" />
                  </div>
                </div>
              )}

              {/* Bank Transfer */}
              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-3">Transfer to:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bank Name:</span>
                        <span className="font-medium">First National Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Account Number:</span>
                        <span className="font-medium">1234567890</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Routing Number:</span>
                        <span className="font-medium">021000021</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Reference:</span>
                        <span className="font-medium text-primary">ORDER-{Date.now().toString().slice(-8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <Clock className="h-4 w-4 text-warning shrink-0" />
                    <p className="text-xs text-warning">Processing time: 1-3 business days</p>
                  </div>
                </div>
              )}

              {/* Crypto Payment */}
              {paymentMethod === 'crypto' && (
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-3">Send USDT (TRC20) to:</p>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                      <code className="text-sm font-mono flex-1 break-all">
                        TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
                      </code>
                      <button 
                        onClick={() => copyToClipboard('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE')}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <p className="text-xs text-success">Instant confirmation after payment detected</p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                All transactions are secured with 256-bit SSL encryption. Your payment information is never stored on our servers.
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              variant="glow" 
              size="xl" 
              className="w-full"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                'Processing Payment...'
              ) : (
                `Pay $${packageData.usd.toLocaleString()} & Receive ${packageData.usdt.toLocaleString()} USDT`
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
