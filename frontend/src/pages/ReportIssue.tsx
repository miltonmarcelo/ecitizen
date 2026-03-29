import { MapPin, ThumbsUp, Eye, ChevronDown, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import TopBar from "@/components/TopBar";

const CATEGORIES = [
  "Roads & Potholes",
  "Water & Sewage",
  "Electricity",
  "Waste Management",
  "Public Safety",
  "Parks & Recreation",
  "Other",
];

const DUPLICATES = [
  { id: 1, title: "Pothole on Moi Avenue", area: "CBD, Nairobi", status: "Under Review", supports: 23 },
  { id: 2, title: "Broken Street Light", area: "Westlands", status: "In Progress", supports: 14 },
  { id: 3, title: "Blocked Drainage", area: "Kilimani, Nairobi", status: "Reported", supports: 8 },
];

const statusColor = (status: string) => {
  if (status === "In Progress") return "bg-primary/10 text-primary";
  if (status === "Under Review") return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
};

const ReportIssuePage = () => {
  const [category, setCategory] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [town, setTown] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [eircode, setEircode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmitIssue = async () => {
    setError("");

    if (!title.trim()) {
      setError("Please enter an issue title.");
      return;
    }

    if (!category.trim()) {
      setError("Please select a category.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!addressLine1.trim()) {
      setError("Please enter Address 1.");
      return;
    }

    if (!town.trim()) {
      setError("Please enter a town.");
      return;
    }

    if (!city.trim()) {
      setError("Please enter a city.");
      return;
    }

    if (!county.trim()) {
      setError("Please enter a county.");
      return;
    }

    const location = {
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      town: town.trim(),
      city: city.trim(),
      county: county.trim(),
      eircode: eircode.trim(),
    };

    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        throw new Error("You must be logged in to submit an issue.");
      }

      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
        }),
      });

      const data = await response.json();

      console.log("Create issue response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit issue");
      }

      navigate("/report-success", {
        state: {
          caseId: data.issue.caseId,
        },
      });
    } catch (err: any) {
      setError(err.message || "Unable to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-5">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <h2 className="text-xl font-bold text-foreground">Report a New Issue</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tell us what happened and where</p>
        </motion.div>

        <motion.section
          className="card-civic space-y-4"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
        >
          <h3 className="section-title">Issue Details</h3>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Issue Title</label>
            <input
              className="input-civic"
              placeholder="e.g. Pothole on Main Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <button
              type="button"
              className="input-civic flex items-center justify-between text-left"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span className={category ? "text-foreground" : "text-muted-foreground"}>
                {category || "Select a category"}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors text-foreground"
                    onClick={() => {
                      setCategory(c);
                      setShowDropdown(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              className="input-civic min-h-[100px] resize-none"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </motion.section>

        <motion.section
          className="card-civic space-y-4"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          <h3 className="section-title">Location</h3>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address 1</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="input-civic pl-10"
                placeholder="Enter address line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address 2</label>
            <input
              className="input-civic"
              placeholder="Enter address line 2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Town</label>
            <input
              className="input-civic"
              placeholder="Enter town"
              value={town}
              onChange={(e) => setTown(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
            <input
              className="input-civic"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">County</label>
            <input
              className="input-civic"
              placeholder="Enter county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Eircode</label>
            <input
              className="input-civic"
              placeholder="Enter Eircode"
              value={eircode}
              onChange={(e) => setEircode(e.target.value)}
            />
          </div>

          {/* <button type="button" className="btn-secondary-civic flex items-center gap-2 w-full justify-center">
            <Crosshair className="w-4 h-4" />
            Use Current Location
          </button> */}

          {/* <div className="rounded-xl bg-muted h-32 flex items-center justify-center border border-border">
            <div className="text-center">
              <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Location preview</span>
            </div>
          </div> */}
        </motion.section>

        <motion.section
          className="card-civic space-y-3"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
        >
          <h3 className="section-title">Possible Duplicates</h3>
          <p className="text-xs text-muted-foreground -mt-1">Similar issues reported nearby</p>

          <div className="space-y-2.5">
            {DUPLICATES.map((d) => (
              <div key={d.id} className="duplicate-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{d.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.area}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>
                        {d.status}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {d.supports}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" /> Support
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto flex gap-3">
          <button className="btn-outline-civic flex-1" onClick={() => navigate("/dashboard")}>
            Cancel
          </button>
          <button className="btn-primary-civic flex-1" onClick={handleSubmitIssue} disabled={loading}>
            {loading ? "Submitting..." : "Submit Issue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIssuePage;