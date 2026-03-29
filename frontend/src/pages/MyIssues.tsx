import {
  ArrowLeft,
  User,
  Search,
  ChevronDown,
  X,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import TopBar from "@/components/TopBar";

const ALL_ISSUES = [
  {
    id: "EC-2026-00124",
    title: "Broken streetlight near bus stop",
    category: "Street Lighting",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "21 Mar 2026",
    location: "Ranelagh Road",
    description: "The streetlight near the main bus stop has been flickering for two weeks and is now completely off.",
  },
  {
    id: "EC-2026-00118",
    title: "Pothole near Main Street junction",
    category: "Roads & Pavements",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "18 Mar 2026",
    location: "Main St & 3rd Ave",
    description: "Large pothole approximately 30cm wide causing vehicles to swerve. Risk to cyclists.",
  },
  {
    id: "EC-2026-00115",
    title: "Overflowing waste bin at park",
    category: "Waste & Recycling",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "10 Mar 2026",
    location: "Central Park, Gate B",
    description: "The public waste bin near Gate B has been overflowing since last weekend.",
  },
  {
    id: "EC-2026-00110",
    title: "Graffiti on community hall wall",
    category: "Public Property",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "8 Mar 2026",
    location: "Oak Avenue Community Hall",
    description: "Large graffiti appeared on the south-facing wall of the community hall overnight.",
  },
  {
    id: "EC-2026-00102",
    title: "Blocked drainage on River Road",
    category: "Water & Drainage",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "3 Mar 2026",
    location: "River Road, near bridge",
    description: "Storm drain blocked with debris causing water to pool on the road during rain.",
  },
  {
    id: "EC-2026-00098",
    title: "Damaged park bench",
    category: "Public Property",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "28 Feb 2026",
    location: "Elm Park, east entrance",
    description: "Wooden bench near the east entrance has two broken slats and is unsafe to sit on.",
  },
  {
    id: "EC-2026-00091",
    title: "Illegal dumping near river",
    category: "Waste & Recycling",
    status: "Awaiting Info",
    statusColor: "bg-muted text-muted-foreground",
    date: "22 Feb 2026",
    location: "River Road, south bank",
    description: "Construction waste has been dumped along the south bank of the river near the walking trail.",
  },
  {
    id: "EC-2026-00085",
    title: "Faulty traffic signal at Oak Avenue",
    category: "Street Lighting",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "15 Feb 2026",
    location: "Oak Avenue & Birch St",
    description: "Traffic signal stuck on red for the north-south direction during peak hours.",
  },
];

const CATEGORIES = ["All", "Street Lighting", "Roads & Pavements", "Waste & Recycling", "Public Property", "Water & Drainage"];
const STATUSES = ["All", "Open", "In Progress", "Resolved", "Awaiting Info"];
const SORT_OPTIONS = ["Newest first", "Oldest first", "Category A–Z", "Category Z–A", "Status"];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const MyIssuesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && STATUSES.includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);
  const [sort, setSort] = useState("Newest first");
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let list = ALL_ISSUES.filter((issue) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        issue.id.toLowerCase().includes(q) ||
        issue.location.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || issue.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    switch (sort) {
      case "Oldest first":
        list = [...list].reverse();
        break;
      case "Category A–Z":
        list = [...list].sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "Category Z–A":
        list = [...list].sort((a, b) => b.category.localeCompare(a.category));
        break;
      case "Status":
        list = [...list].sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return list;
  }, [search, statusFilter, categoryFilter, sort]);

  const hasActiveFilters = statusFilter !== "All" || categoryFilter !== "All" || search !== "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-foreground">My Reported Issues</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View, search, and track the issues you have submitted.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div {...fadeUp(0.05)} className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, ID, or location"
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

          {/* Filters row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "Status" : s}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "Category" : c}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Sort */}
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

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("All"); setCategoryFilter("All"); }}
                className="text-xs text-destructive font-medium hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results summary */}
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {ALL_ISSUES.length} reports
          </p>
        </motion.div>

        {/* Issue List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <motion.div {...fadeUp(0.1)} className="card-civic text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No issues found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </motion.div>
          ) : (
            filtered.map((issue, idx) => (
              <motion.div
                key={issue.id}
                {...fadeUp(0.08 + idx * 0.04)}
                className="card-civic space-y-2.5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/issue/${issue.id}`)}
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
                    <FileText size={11} /> {issue.id}
                  </span>
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

                <button
                  onClick={() => navigate(`/issue/${issue.id}`)}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 pt-0.5"
                >
                  View Details <ChevronRight size={12} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default MyIssuesPage;
