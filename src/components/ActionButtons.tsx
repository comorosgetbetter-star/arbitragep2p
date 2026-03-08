import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const ActionButtons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="default"
        className="h-12 rounded-xl text-sm font-semibold bg-[hsl(80,85%,55%)] hover:bg-[hsl(80,85%,48%)] text-[hsl(0,0%,6%)]"
        onClick={() => {
          if (!user) {
            navigate('/login');
          } else {
            document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Deposit crypto
      </Button>
      <Button
        variant="default"
        className="h-12 rounded-xl text-sm font-semibold bg-[hsl(80,85%,55%)] hover:bg-[hsl(80,85%,48%)] text-[hsl(0,0%,6%)]"
        onClick={() => {
          document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        P2P trading
      </Button>
    </div>
  );
};
