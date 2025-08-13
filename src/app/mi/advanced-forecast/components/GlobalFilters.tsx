import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface GlobalFiltersProps {
  weaponSystem: string;
  setWeaponSystem: (value: string) => void;
  horizon: "Now" | "12mo" | "5yr";
  setHorizon: (value: "Now" | "12mo" | "5yr") => void;
  scenario: "Baseline" | "What-if";
  setScenario: (value: "Baseline" | "What-if") => void;
}

export function GlobalFilters({
  weaponSystem,
  setWeaponSystem,
  horizon,
  setHorizon,
  scenario,
  setScenario,
}: GlobalFiltersProps) {
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Weapon System:</label>
          <Select value={weaponSystem} onValueChange={setWeaponSystem}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B52H">B-52H</SelectItem>
              <SelectItem value="F16">F-16</SelectItem>
              <SelectItem value="C130">C-130</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Horizon:</label>
          <div className="flex gap-1">
            {(["Now", "12mo", "5yr"] as const).map((h) => (
              <Badge
                key={h}
                variant={horizon === h ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setHorizon(h)}
              >
                {h}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Scenario:</label>
          <div className="flex gap-1">
            {(["Baseline", "What-if"] as const).map((s) => (
              <Badge
                key={s}
                variant={scenario === s ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setScenario(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="secondary" className="text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>
    </div>
  );
}
