const LABELS = {
  IN_STOCK: "In stock",
  ASSIGNED: "Assigned",
  RETURNED: "Returned",
  RETIRED: "Retired",
  ACTIVE: "Active",
};

const CLASS_MAP = {
  IN_STOCK: "status-in-stock",
  ASSIGNED: "status-assigned",
  ACTIVE: "status-assigned",
  RETURNED: "status-returned",
  RETIRED: "status-retired",
};

export default function StatusPill({ status }) {
  const cls = CLASS_MAP[status] || "status-returned";
  const label = LABELS[status] || status;
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
