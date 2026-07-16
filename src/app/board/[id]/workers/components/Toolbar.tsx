import { useState } from "react";
import { Settings, Download } from "lucide-react";
import "./toolbar.css"; // styles séparés

type ToolbarProps = {
  options: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }[];
  onExportCsv?: () => void;
};

export function Toolbar({ options, onExportCsv }: ToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="toolbar-container">
      <button
        className="toolbar-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Afficher les options"
      >
        <Settings />
      </button>

      <div className={`toolbar-panel ${open ? "open" : ""}`}>
        <p>Hashrate: </p>
        {options.map((opt) => (
          <label key={opt.id} className="toolbar-option">
            <input
              type="checkbox"
              checked={opt.checked}
              onChange={(e) => opt.onChange(e.target.checked)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {onExportCsv && (
        <button
          type="button"
          className="secondary"
          onClick={onExportCsv}
          aria-label="Exporter les statistiques au format CSV"
          style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}
        >
          <Download size={16} />
          Exporter CSV
        </button>
      )}
    </div>
  );
}