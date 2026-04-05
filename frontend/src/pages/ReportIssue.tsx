import { ThumbsUp, Eye, ChevronDown, MapPin, Crosshair, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TopBar from "@/components/TopBar";
import MiniLocationMap from "@/components/MiniLocationMap";
import { useAuth } from "@/context/AuthContext";
import { formatIssueStatus, getIssueStatusClass } from "@/lib/issueMeta";

type Category = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

type LocationMode =
  | "idle"
  | "gps-select"
  | "gps-confirmed"
  | "manual-entry"
  | "manual-confirmed";

const DUPLICATES = [
  { id: 1, title: "Pothole on Main Road", area: "City Centre", status: "UNDER_REVIEW", supports: 23 },
  { id: 2, title: "Broken Street Light", area: "West District", status: "IN_PROGRESS", supports: 14 },
  { id: 3, title: "Blocked Drainage", area: "South Area", status: "CREATED", supports: 8 },
];

const LOCATION_MESSAGES = {
  gpsReady: "Move the pin if needed, then confirm the location.",
  pinUpdated: "Pin updated. Confirm the location when ready.",
  confirmed: "Location confirmed.",
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedCategoryId = useMemo(() => {
    const raw = searchParams.get("categoryId");
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [town, setTown] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [locationMode, setLocationMode] = useState<LocationMode>("idle");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setError("");

        if (!user) {
          setCategories([]);
          return;
        }

        const token = await user.getIdToken();

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load categories");
        }

        const fetchedCategories = Array.isArray(data.categories) ? data.categories : [];
        setCategories(fetchedCategories);
      } catch (err: any) {
        setError(err.message || "Unable to load categories.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (!authLoading) {
      fetchCategories();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!requestedCategoryId || categories.length === 0) return;

    const matchedCategory = categories.find((category) => category.id === requestedCategoryId);

    if (matchedCategory) {
      setSelectedCategory(matchedCategory);
    }
  }, [requestedCategoryId, categories]);

  const isLocationConfirmed =
    locationMode === "gps-confirmed" || locationMode === "manual-confirmed";

  const summaryAddress1 = addressLine1 || "Not available";
  const summaryCity = city || "Not available";

  const getGeoapifyApiKey = () => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

    if (!apiKey) {
      throw new Error("Geoapify API key is missing. Please add VITE_GEOAPIFY_API_KEY to your .env file.");
    }

    return apiKey;
  };

  const reverseGeocodeFromGeoapify = async (lat: number, lon: number) => {
    const apiKey = getGeoapifyApiKey();

    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to retrieve address from Geoapify.");
    }

    const result = data?.features?.[0]?.properties;

    if (!result) {
      throw new Error("No address was found for the selected location.");
    }

    const houseNumber = result.housenumber ? `${result.housenumber} ` : "";
    const street = result.street || "";
    const resolvedAddress1 =
      result.address_line1 ||
      `${houseNumber}${street}`.trim() ||
      result.name ||
      "";

    return {
      addressLine1: resolvedAddress1,
      addressLine2: "",
      town: result.suburb || result.neighbourhood || result.district || "",
      city: result.city || result.town || result.village || "",
      county: result.county || result.state || "",
    };
  };

  const forwardGeocodeFromGeoapify = async () => {
    const apiKey = getGeoapifyApiKey();

    const searchText = [addressLine1, addressLine2, town, city, county]
      .filter(Boolean)
      .join(", ");

    if (!searchText.trim()) {
      throw new Error("Please enter the address before confirming the location.");
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      searchText
    )}&filter=countrycode:ie&apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to locate the manual address.");
    }

    const result = data?.features?.[0]?.properties;

    if (!result) {
      throw new Error("We could not confirm that address. Please refine it and try again.");
    }

    return {
      latitude: result.lat as number,
      longitude: result.lon as number,
      town: town || result.suburb || result.neighbourhood || result.district || "",
      city: city || result.city || result.town || result.village || "",
      county: county || result.county || result.state || "",
    };
  };

  const getBestCurrentPosition = async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      let bestPosition: GeolocationPosition | null = null;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
        },
        (geoError) => {
          navigator.geolocation.clearWatch(watchId);
          reject(geoError);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);

        if (bestPosition) {
          resolve(bestPosition);
        } else {
          reject(new Error("Unable to retrieve your location."));
        }
      }, 4000);
    });
  };

  const resetLocationState = () => {
    setLatitude(null);
    setLongitude(null);
    setLocationMessage("");
    setAddressLine1("");
    setAddressLine2("");
    setTown("");
    setCity("");
    setCounty("");
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setLocationMessage("");

    try {
      setLocationLoading(true);

      const position = await getBestCurrentPosition();

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setLocationMode("gps-select");
      setLocationMessage(LOCATION_MESSAGES.gpsReady);
    } catch (err: any) {
      if (err?.code === 1) {
        setError("Location access was denied. You can add the address manually.");
      } else if (err?.code === 2) {
        setError("Your location could not be determined. Please add the address manually.");
      } else if (err?.code === 3) {
        setError("Location request timed out. Please try again or add the address manually.");
      } else {
        setError(err.message || "Unable to retrieve your location.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleConfirmGpsLocation = async () => {
    if (latitude === null || longitude === null) {
      setError("Please select a location first.");
      return;
    }

    try {
      setError("");
      setLocationLoading(true);

      const resolved = await reverseGeocodeFromGeoapify(latitude, longitude);

      setAddressLine1(resolved.addressLine1);
      setAddressLine2(resolved.addressLine2);
      setTown(resolved.town);
      setCity(resolved.city);
      setCounty(resolved.county);

      setLocationMode("gps-confirmed");
      setLocationMessage(LOCATION_MESSAGES.confirmed);
    } catch (err: any) {
      setError(err.message || "Unable to confirm the selected location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleShowManualAddress = () => {
    setError("");
    setLocationMessage("");
    resetLocationState();
    setLocationMode("manual-entry");
  };

  const handleConfirmManualLocation = async () => {
    if (!addressLine1.trim()) {
      setError("Please enter Address 1.");
      return;
    }

    if (!city.trim()) {
      setError("Please enter a city.");
      return;
    }

    try {
      setError("");
      setLocationLoading(true);

      const resolved = await forwardGeocodeFromGeoapify();

      setLatitude(resolved.latitude);
      setLongitude(resolved.longitude);
      setTown(resolved.town);
      setCity(resolved.city);
      setCounty(resolved.county);

      setLocationMode("manual-confirmed");
      setLocationMessage(LOCATION_MESSAGES.confirmed);
    } catch (err: any) {
      setError(err.message || "Unable to confirm the manual address.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleTryAgainGps = () => {
    setError("");
    setLocationMessage("");
    setLocationMode("gps-select");
  };

  const handleEditManualAddress = () => {
    setError("");
    setLocationMessage("");
    setLocationMode("manual-entry");
  };

  const handleMapLocationChange = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationMessage(LOCATION_MESSAGES.pinUpdated);
  };

  const handleSubmitIssue = async () => {
    setError("");

    if (!title.trim()) {
      setError("Please enter an issue title.");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!isLocationConfirmed) {
      setError("Please confirm the location before submitting.");
      return;
    }

    if (!addressLine1.trim()) {
      setError("Please confirm a valid address.");
      return;
    }

    if (!city.trim()) {
      setError("Please confirm a valid city.");
      return;
    }

    try {
      setLoading(true);

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
          title: title.trim(),
          description: description.trim(),
          categoryId: selectedCategory.id,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || null,
          town: town.trim() || null,
          city: city.trim(),
          county: county.trim() || null,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Issue Title
            </label>
            <input
              className="input-civic"
              placeholder="e.g. Pothole on Main Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Category
            </label>
            <button
              type="button"
              className="input-civic flex items-center justify-between text-left"
              onClick={() => setShowDropdown((prev) => !prev)}
              disabled={categoriesLoading || categories.length === 0}
            >
              <span className={selectedCategory ? "text-foreground" : "text-muted-foreground"}>
                {categoriesLoading
                  ? "Loading categories..."
                  : selectedCategory?.name || "Select a category"}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {showDropdown && !categoriesLoading && categories.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors text-foreground"
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowDropdown(false);
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Description
            </label>
            <textarea
              className="input-civic min-h-[100px] resize-none"
              placeholder="Describe the issue in detail. The more you tell us about the issue, the better we can help."
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

          {(locationMode === "idle" || locationMode === "gps-select") && (
            <>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
                className="btn-secondary-civic flex items-center gap-2 w-full justify-center"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4" />
                    Use Current Location
                  </>
                )}
              </button>

              {(locationMode === "idle" ||
                locationMode === "gps-select" ||
                locationMode === "gps-confirmed") && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleShowManualAddress}
                    className="text-sm text-primary hover:underline"
                  >
                    Add address manually
                  </button>
                </div>
              )}

              <div className="rounded-xl bg-muted min-h-32 flex items-center justify-center border border-border px-4 py-4">
                {locationMode === "gps-select" && latitude !== null && longitude !== null ? (
                  <div className="w-full space-y-3">
                    <MiniLocationMap
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={handleMapLocationChange}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Drag the pin to the exact location if needed.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">Location preview</span>
                  </div>
                )}
              </div>

              {locationMode === "gps-select" && (
                <button
                  type="button"
                  onClick={handleConfirmGpsLocation}
                  disabled={locationLoading || latitude === null || longitude === null}
                  className="btn-primary-civic w-full"
                >
                  {locationLoading ? "Confirming..." : "Confirm Location"}
                </button>
              )}
            </>
          )}

          {locationMode === "manual-entry" && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Address 1
                  </label>
                  <input
                    className="input-civic"
                    placeholder="House number and street"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Address 2
                  </label>
                  <input
                    className="input-civic"
                    placeholder="Apartment, building, or landmark optional"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Area
                  </label>
                  <input
                    className="input-civic"
                    placeholder="Area, suburb, or locality optional"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Town or City
                  </label>
                  <input
                    className="input-civic"
                    placeholder="Enter town or city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    County
                  </label>
                  <input
                    className="input-civic"
                    placeholder="Enter county"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmManualLocation}
                disabled={locationLoading}
                className="btn-primary-civic w-full"
              >
                {locationLoading ? "Confirming..." : "Confirm Location"}
              </button>
            </>
          )}

          {(locationMode === "gps-confirmed" || locationMode === "manual-confirmed") && (
            <>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 space-y-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Address 1
                  </p>
                  <p className="text-sm text-foreground mt-1">{summaryAddress1}</p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    City
                  </p>
                  <p className="text-sm text-foreground mt-1">{summaryCity}</p>
                </div>
              </div>

              {locationMode === "gps-confirmed" && (
                <button
                  type="button"
                  onClick={handleTryAgainGps}
                  className="btn-outline-civic w-full"
                >
                  Try Again
                </button>
              )}

              {locationMode === "manual-confirmed" && (
                <button
                  type="button"
                  onClick={handleEditManualAddress}
                  className="btn-outline-civic w-full"
                >
                  Edit Address
                </button>
              )}
            </>
          )}

            {locationMessage && (
              <p className="text-xs text-primary text-center">
                {locationMessage}
              </p>
            )}
        </motion.section>

        <motion.section
          className="card-civic space-y-3"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
        >
          <h3 className="section-title">Possible Duplicates</h3>
          <p className="text-xs text-muted-foreground -mt-1">
            Similar issues reported nearby
          </p>

          <div className="space-y-2.5">
            {DUPLICATES.map((d) => (
              <div key={d.id} className="duplicate-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {d.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.area}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getIssueStatusClass(d.status)}`}
                      >
                        {formatIssueStatus(d.status)}
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
          <button
            className="btn-outline-civic flex-1"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>
          <button
            className="btn-primary-civic flex-1"
            onClick={handleSubmitIssue}
            disabled={loading || categoriesLoading || locationLoading}
          >
            {loading ? "Submitting..." : "Submit Issue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIssuePage;
