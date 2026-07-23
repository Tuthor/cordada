import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  label?: string;
  fallback?: string;
  floating?: boolean;
}

export const BackButton = ({
  className,
  label = 'Volver',
  fallback = '/',
  floating = false,
}: BackButtonProps) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        floating &&
          'fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background',
        className,
      )}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

export default BackButton;
