import { Loader2, Building2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Buscando imóveis..." }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-primary animate-pulse-soft" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-accent-foreground animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Isso pode levar alguns segundos...
        </p>
      </div>
    </div>
  );
};
