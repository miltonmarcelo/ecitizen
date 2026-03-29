import {
  ArrowLeft,
  User,
  Search,
  ChevronDown,
  X,
  MapPin,
  Calendar,
  Tag,
  ChevronRight,
  ThumbsUp,
  Info,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import TopBar from "@/components/TopBar";

const AREA_ISSUES = [
  {
    id: "PUB-2026-00201",
    title: "Pothole near bus stop",
    category: "Roads & Pavements",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "20 Mar 2026",
    location: "Ranelagh Road",
    description: "Large pothole causing traffic issues near the junction. Multiple vehicles have been damaged.",
    supporters: 14,
  },
  {
    id: "PUB-2026-00198",
    title: "Power outage in Block C",
    category: "Electricity & Power",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "19 Mar 2026",
    location: "Block C, Ranelagh",
    description: "Intermittent power outages affecting the entire block since last Tuesday evening.",
    supporters: 12,
  },
  {
    id: "PUB-2026-00192",
    title: "Illegal dumping near river",
    category: "Waste & Recycling",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "17 Mar 2026",
    location: "River Road, south bank",
    description: "Construction waste has been dumped along the south bank near the walking trail.",
    supporters: 8,
  },
  {
    id: "PUB-2026-00185",
    title: "Faulty traffic signal",
    category: "Street Lighting",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "15 Mar 2026",
    location: "Oak Avenue & Birch St",
    description: "Traffic signal stuck on red for the north-south direction during peak hours.",
    supporters: 5,
  },
  {
    id: "PUB-2026-00180",
    title: "Broken playground equipment",
    category: "Public Property",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "12 Mar 2026",
    location: "Ranelagh Gardens",
    description: "The swing set in the children's playground has a broken chain and is unsafe.",
    supporters: 21,
  },
  {
    id: "PUB-2026-00174",
    title: "Overflowing public bin",
    category: "Waste & Recycling",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "10 Mar 2026",
    location: "Ranelagh Village",
    description: "Public waste bin near the post office has been overflowing for several days.",
    supporters: 9,
  },
  {
    id: "PUB-2026-00168",
    title: "Damaged footpath tiles",
    category: "Roads & Pavements",
    status: "Awaiting Info",
    statusColor: "bg-muted text-muted-foreground",
    date: "8 Mar 2026",
    location: "Chelmsford Road",
    description: "Several footpath tiles are cracked and uneven, posing a trip hazard for pedestrians.",
    supporters: 3,
  },
];

const CATEGORIES = ["All", "Street Lighting", "Roads & Pavements", "Waste & Recycling", "Public Property", "Electricity & Power"];
const STATUSES = ["All", "Open", "In Progress", "Resolved", "Awaiting Info"];
const SORT_OPTIONS = ["Most supported", "Newest first", "Oldest first", "Status", "Category A–Z"];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const AreaIssuesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState("Most supported");
  const [showSort, setShowSort] = useState(false);
  const [supportedIds, setSupportedIds] = useState<Set<string>>(new Set());

  const handleSupport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSupportedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = AREA_ISSUES.filter((issue) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        issue.category.toLowerCase().includes(q) ||
        issue.location.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || issue.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    switch (sort) {
      case "Most supported":
        list = [...list].sort((a, b) => {
          const aCount = a.supporters + (supportedIds.has(a.id) ? 1 : 0);
          const bCount = b.supporters + (supportedIds.has(b.id) ? 1 : 0);
          return bCount - aCount;
        });
        break;
      case "Oldest first":
        list = [...list].reverse();
        break;
      case "Category A–Z":
        list = [...list].sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "Status":
        list = [...list].sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return list;
  }, [search, statusFilter, categoryFilter, sort, supportedIds]);

  const hasActiveFilters = statusFilter !== "All" || categoryFilter !== "All" || search !== "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Area Summary */}
        <motion.div {...fadeUp(0)}>
          <div className="card-civic">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Ranelagh, Dublin 6</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing public issues reported in this area
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{AREA_ISSUES.length}</span> issues found
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div {...fadeUp(0.05)}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2.5">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">See something already reported?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Support an existing issue instead of creating a duplicate report.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div {...fadeUp(0.1)} className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, category, or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-civic pl-10 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s === "All" ? "Status" : s}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c === "All" ? "Category" : c}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative ml-auto">
              <button
                onClick={() => setShowSort(!showSort)}
                className="text-xs font-medium rounded-lg border border-border bg-card px-3 py-2 text-foreground hover:bg-muted transition-colors flex items-center gap-1"
              >
                Sort <ChevronDown size={12} />
              </button>
              {showSort && (
                <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSort(opt); setShowSort(false); }}
                      className={`block w-full text-left text-xs px-4 py-2 hover:bg-muted transition-colors ${sort === opt ? "text-primary font-semibold" : "text-foreground"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("All"); setCategoryFilter("All"); }}
                className="text-xs text-destructive font-medium hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} issues in Ranelagh
          </p>
        </motion.div>

        {/* Issue List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <motion.div {...fadeUp(0.15)} className="card-civic text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No issues found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </motion.div>
          ) : (
            filtered.map((issue, idx) => {
              const isSupported = supportedIds.has(issue.id);
              const count = issue.supporters + (isSupported ? 1 : 0);

              return (
                <motion.div
                  key={issue.id}
                  {...fadeUp(0.12 + idx * 0.04)}
                  className="card-civic space-y-2.5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/area-issue/${issue.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">
                      {issue.title}
                    </h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${issue.statusColor}`}>
                      {issue.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag size={11} /> {issue.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {issue.date}
                    </span>
                  </div>

                  {/* Support section */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <ThumbsUp size={13} className="text-primary" />
                      <span>{count} supporters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleSupport(issue.id, e)}
                        disabled={isSupported}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          isSupported
                            ? "bg-accent/15 text-accent cursor-default"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {isSupported ? "✓ Supported" : "Support This"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/area-issue/${issue.id}`);
                        }}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                      >
                        Details <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default AreaIssuesPage;
