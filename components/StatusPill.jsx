const LABELS = {
  IN_STOCK: "In stock",
  ASSIGNED: "Assigned",
  RETURNED: "Returned",
  UNDER_MAINTENANCE: "Under maintenance",
  RETIRED: "Retired",
  ACTIVE: "Active",
};

const CLASS_MAP = {
  IN_STOCK: "status-in-stock",
  ASSIGNED: "status-assigned",
  ACTIVE: "status-assigned",
  RETURNED: "status-returned",
  UNDER_MAINTENANCE: "status-maintenance",
  RETIRED: "status-retired",
};

export default function StatusPill({ status }) {
  const cls = CLASS_MAP[status] || "status-returned";
  const label = LABELS[status] || status;
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
