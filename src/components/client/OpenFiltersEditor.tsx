import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { expertiseOptions } from '@/data/cordadaData';
import type { CordadaOpenFilters } from '@/types/cordada';
import { Info } from 'lucide-react';

interface Props {
  value: CordadaOpenFilters | null;
  onChange: (next: CordadaOpenFilters) => void;
}

export const OpenFiltersEditor = ({ value, onChange }: Props) => {
  const filters: CordadaOpenFilters = value ?? {};
  const selectedExpertise = filters.expertise_tags ?? [];
  const availabilityRequired = filters.availability_required === true;

  const toggleExpertise = (tag: string) => {
    const next = selectedExpertise.includes(tag)
      ? selectedExpertise.filter((t) => t !== tag)
      : [...selectedExpertise, tag];
    onChange({ ...filters, expertise_tags: next });
  };

  const toggleAvailability = (checked: boolean) => {
    onChange({ ...filters, availability_required: checked });
  };

  return (
    <div className="space-y-5 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          El filtro por expertise solo alcanza a consultores que hayan completado su perfil
          profesional.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Expertise requerido</Label>
        <div className="flex flex-wrap gap-2">
          {expertiseOptions.map((tag) => {
            const active = selectedExpertise.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleExpertise(tag)}
                className="focus:outline-none"
              >
                <Badge
                  variant={active ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                >
                  {tag}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="availability-required"
          checked={availabilityRequired}
          onCheckedChange={(c) => toggleAvailability(c === true)}
        />
        <Label htmlFor="availability-required" className="text-sm cursor-pointer">
          Disponibilidad requerida
        </Label>
      </div>
    </div>
  );
};
