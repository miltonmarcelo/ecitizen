import {
  ThumbsUp,
  Eye,
  ChevronDown,
  MapPin,
  Crosshair,
  Loader2,
  Camera,
  ImagePlus,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MiniLocationMap from "@/components/MiniLocationMap";
import { useAuth } from "@/context/AuthContext";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import { dublinAreas, localAreasByDublinArea } from "@/data/dublinLocations";
import { uploadIssuePhoto } from "@/lib/issuePhoto";

// Matches category objects from the API where some fields can be missing.
type Category = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

// Tracks which step of the location flow is currently active.
type LocationMode =
  | "idle"
  | "gps-select"
  | "gps-confirmed"
  | "manual-entry"
  | "manual-confirmed";

type AddressState = {
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  area: string;
  city: string;
  county: string;
};

// Stores the geocoded manual address before the user accepts it.
type ManualAddressCandidate = {
  latitude: number;
  longitude: number;
  formatted: string;
};

// Resets manual address fields back to Dublin defaults.
const DEFAULT_ADDRESS: AddressState = {
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  area: "",
  city: "Dublin",
  county: "Dublin",
};

// Maps postcode prefixes from geocoding results to the Dublin Area dropdown.
const POSTCODE_TO_DUBLIN_AREA: Record<string, string> = {
  D01: "Dublin 1",
  D02: "Dublin 2",
  D03: "Dublin 3",
  D04: "Dublin 4",
  D05: "Dublin 5",
  D06: "Dublin 6",
  D6W: "Dublin 6W",
  D07: "Dublin 7",
  D08: "Dublin 8",
  D09: "Dublin 9",
  D10: "Dublin 10",
  D11: "Dublin 11",
  D12: "Dublin 12",
  D13: "Dublin 13",
  D14: "Dublin 14",
  D15: "Dublin 15",
  D16: "Dublin 16",
  D17: "Dublin 17",
  D18: "Dublin 18",
  D20: "Dublin 20",
  D22: "Dublin 22",
  D24: "Dublin 24",
};

// Keeps location status text in one place for GPS and manual flows.
const LOCATION_MESSAGES = {
  gpsReady: "Adjust the pin if needed, then tap Confirm.",
  pinUpdated: "Location updated. Confirm when ready.",
  confirmed: "Location confirmed.",
};

// Shared animation preset for staggered section entry.
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
};

const mapPostcodeToDublinArea = (postcode: string) => {
  const normalized = postcode.trim().toUpperCase();
  if (!normalized) return "";
  // Dublin 6W uses four chars, while other Dublin postcodes map from the first three.
  const routingKey = normalized.startsWith("D6W") ? "D6W" : normalized.slice(0, 3);
  return POSTCODE_TO_DUBLIN_AREA[routingKey] || "";
};

const ReportIssuePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Reads optional ?categoryId=... so a previous screen can preselect a category.
  const requestedCategoryId = useMemo(() => {
    const raw = searchParams.get("categoryId");
    const parsed = Number(raw);
    return raw && !Number.isNaN(parsed) ? parsed : null;
  }, [searchParams]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [address, setAddress] = useState<AddressState>(DEFAULT_ADDRESS);
  const { addressLine1, addressLine2, suburb, area, city, county } = address;

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [locationMode, setLocationMode] = useState<LocationMode>("idle");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [manualAddressCandidate, setManualAddressCandidate] =
    useState<ManualAddressCandidate | null>(null);

  const localAreaOptions = area ? localAreasByDublinArea[area] || [] : [];
  // These flags control which location panel the UI shows.
  const isLocationConfirmed =
    locationMode === "gps-confirmed" || locationMode === "manual-confirmed";
  const isGpsMode = locationMode === "idle" || locationMode === "gps-select";
  const isManualMode = locationMode === "manual-entry";
  const isConfirmedMode =
    locationMode === "gps-confirmed" || locationMode === "manual-confirmed";

  const summaryAddress1 = addressLine1 || "Not available";
  const summaryCity = area || "Not available";

  const updateAddress = (updates: Partial<AddressState>) =>
    setAddress((prev) => ({ ...prev, ...updates }));

  const resetLocationState = () => {
    // Clears old GPS/manual location data before starting another location path.
    setLatitude(null);
    setLongitude(null);
    setLocationMessage("");
    setManualAddressCandidate(null);
    setAddress(DEFAULT_ADDRESS);
  };

  const getGeoapifyApiKey = () => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (!apiKey) {
      // Fail early so we do not call Geoapify with a missing key.
      throw new Error("Geoapify API key is missing. Please add VITE_GEOAPIFY_API_KEY to your .env file.");
    }
    return apiKey;
  };

  const reverseGeocodeFromGeoapify = async (lat: number, lon: number) => {
    const apiKey = getGeoapifyApiKey();
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to retrieve address from Geoapify.");
    }

    const result = data?.results?.[0];

    if (!result) {
      throw new Error("No address found for this location. Try adjusting the pin or enter your address manually.");
    }

    const houseNumber = result.housenumber ? `${result.housenumber} ` : "";
    const street = result.street || "";
    // Try the provider's best address first, then build a fallback from available pieces.
    const resolvedAddress1 =
      result.address_line1 ||
      `${houseNumber}${street}`.trim() ||
      result.name ||
      "";

    return {
      addressLine1: resolvedAddress1,
      addressLine2: "",
      suburb: result.suburb || result.neighbourhood || result.district || result.city || "",
      area: mapPostcodeToDublinArea(result.postcode || ""),
      city: result.city || result.suburb || "Dublin",
      county: "Dublin",
    };
  };

  const forwardGeocodeFromGeoapify = async () => {
    const apiKey = getGeoapifyApiKey();
    // Build one search string from whatever manual fields the user filled in.
    const searchText = [addressLine1, addressLine2, suburb, area, city, county]
      .filter(Boolean)
      .join(", ");

    if (!searchText.trim()) {
      throw new Error("Please enter the address before confirming the location.");
    }

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        searchText
      )}&filter=countrycode:ie&apiKey=${apiKey}`
    );
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
      formatted:
        result.formatted ||
        [
          result.address_line1,
          result.address_line2,
          result.suburb || result.neighbourhood || result.district || result.city,
          result.postcode,
          result.city,
          result.county,
          result.country,
        ]
          .filter(Boolean)
          .join(", "),
      // Keeps the typed suburb/area when available to match the selected dropdown values.
      suburb: suburb || result.suburb || result.neighbourhood || result.district || result.city || "",
      area: area || mapPostcodeToDublinArea(result.postcode || ""),
      city: "Dublin",
      county: "Dublin",
    };
  };

  const getBestCurrentPosition = async (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      let bestPosition: GeolocationPosition | null = null;

      // Watch for a few seconds and keep the most accurate reading we get.
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
        // Stop watching after a short window and use the best reading collected so far.
        navigator.geolocation.clearWatch(watchId);
        bestPosition
          ? resolve(bestPosition)
          : reject(new Error("Unable to retrieve your location. Please add it manually."));
      }, 4000);
    });

  useEffect(() => {
    // Wait for auth to settle before deciding whether categories can be fetched.
    if (authLoading) return;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setError("");

        if (!user) {
          setCategories([]);
          return;
        }

        // Attach the Firebase ID token so the API can verify who is requesting categories.
        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load categories");
        }

        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (err: any) {
        setCategories([]);
        setError(err.message || "Could not load categories. Please refresh and try again.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [user, authLoading]);

  useEffect(() => {
    if (!requestedCategoryId || categories.length === 0) return;
    // Auto-selects the category when a valid ID came from the query string.
    const matchedCategory = categories.find((category) => category.id === requestedCategoryId);
    if (matchedCategory) setSelectedCategory(matchedCategory);
  }, [requestedCategoryId, categories]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        // Clean up old object URLs to avoid leaking memory when previews change.
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

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
      // Maps browser geolocation error codes to clearer messages for the user.
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

      // Convert the selected pin coordinates into a structured Dublin address.
      const resolved = await reverseGeocodeFromGeoapify(latitude, longitude);

      updateAddress({
        addressLine1: resolved.addressLine1,
        addressLine2: resolved.addressLine2,
        suburb: resolved.suburb || "",
        area: resolved.area || "",
        city: "Dublin",
        county: "Dublin",
      });

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
    // Drops any GPS state so manual entry starts clean.
    resetLocationState();
    setLocationMode("manual-entry");
  };

  const handleDublinAreaChange = (value: string) => {
    setManualAddressCandidate(null);
    // Clears local area because options change when Dublin Area changes.
    updateAddress({
      area: value,
      suburb: "",
      city: "Dublin",
      county: "Dublin",
    });
  };

  const handleConfirmManualLocation = async () => {
    if (!addressLine1.trim()) {
      setError("Please enter Address 1.");
      return;
    }

    if (!area.trim()) {
      setError("Please select a Dublin Area.");
      return;
    }

    if (!suburb.trim()) {
      setError("Please select a Local Area.");
      return;
    }

    try {
      setError("");
      setLocationLoading(true);
      setLocationMessage("");
      setManualAddressCandidate(null);

      // Geocode manual fields first so the user can confirm the matched address.
      const resolved = await forwardGeocodeFromGeoapify();

      setManualAddressCandidate({
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        formatted: resolved.formatted,
      });
    } catch (err: any) {
      setManualAddressCandidate(null);
      setError(err.message || "Unable to confirm the manual address.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleAcceptManualAddressCandidate = () => {
    if (!manualAddressCandidate) return;

    setError("");
    // Lock in the confirmed coordinates from the manual address match.
    setLatitude(manualAddressCandidate.latitude);
    setLongitude(manualAddressCandidate.longitude);

    updateAddress({
      suburb,
      area,
      city: "Dublin",
      county: "Dublin",
    });

    setLocationMode("manual-confirmed");
    setLocationMessage(LOCATION_MESSAGES.confirmed);
    setManualAddressCandidate(null);
  };

  const handleRejectManualAddressCandidate = () => {
    setError("");
    setLocationMessage("");
    setManualAddressCandidate(null);
    setLocationMode("manual-entry");
  };

  const handleTryAgainGps = () => {
    setError("");
    setLocationMessage("");
    setLocationMode("gps-select");
  };

  const handleEditManualAddress = () => {
    setError("");
    setLocationMessage("");
    setManualAddressCandidate(null);
    setLocationMode("manual-entry");
  };

  const handleMapLocationChange = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationMessage(LOCATION_MESSAGES.pinUpdated);
  };

  const handleOpenPhotoPicker = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (photoPreviewUrl) {
      // Replace the previous preview URL before generating a new one.
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setError("");
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoFile(null);
    setPhotoPreviewUrl("");

    if (fileInputRef.current) {
      // Resets the file input so selecting the same image again still triggers change.
      fileInputRef.current.value = "";
    }
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

    if (!area.trim()) {
      setError("Please select a Dublin Area.");
      return;
    }

    if (!suburb.trim()) {
      setError("Please select a Local Area.");
      return;
    }

    try {
      setLoading(true);

      if (!user) {
        throw new Error("You must be logged in to submit an issue.");
      }

      // Send Firebase auth so the backend can verify and link the report to this user.
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
          suburb: suburb.trim() || null,
          area: area.trim() || null,
          city: city.trim() || "Dublin",
          county: county.trim() || "Dublin",
          latitude,
          longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit your report. Please try again.");
      }

      if (photoFile && user?.uid) {
        try {
          // Upload the photo after issue creation so it can be tied to the new case ID.
          await uploadIssuePhoto(photoFile, user.uid, data.issue.caseId);
        } catch (uploadError) {
          // Keeps issue submission successful even if photo upload fails.
          console.error("Photo upload failed:", uploadError);
        }
      }

      // Passes the new case ID so the success screen can show it.
      navigate("/report-success", {
        state: { caseId: data.issue.caseId },
      });
    } catch (err: any) {
      setError(err.message || "Unable to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CitizenLayout width="default" showBack backTo="/dashboard" showProfile>
      <div className="space-y-5 pb-32">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <PageHeader
            title="Report a New Issue"
            subtitle="Tell us what happened and where"
            className="mb-0"
          />
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <SectionCard bodyClassName="space-y-4">
            
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
                Title
              </label>
              <input
                className="input-civic"
                placeholder="e.g. Pothole on Main Road"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
          </SectionCard>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <SectionCard bodyClassName="space-y-4">
            <h3 className="section-title">Where is the issue?</h3>

            {isGpsMode && (
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
                      Detecting your location...
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-4 h-4" />
                      Use Current Location
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleShowManualAddress}
                    className="text-sm text-primary hover:underline"
                  >
                    Enter address manually
                  </button>
                </div>

                <div className="rounded-xl bg-muted min-h-32 flex items-center justify-center border border-border px-4 py-4">
                  {locationMode === "gps-select" && latitude !== null && longitude !== null ? (
                    <div className="w-full space-y-3">
                      <MiniLocationMap
                        latitude={latitude}
                        longitude={longitude}
                        onLocationChange={handleMapLocationChange}
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">
                        Your location will appear here
                      </span>
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

            {isManualMode && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Address
                    </label>
                    <input
                      className="input-civic"
                      placeholder="House number and street"
                      value={addressLine1}
                      onChange={(e) => {
                        setManualAddressCandidate(null);
                        updateAddress({ addressLine1: e.target.value });
                      }}
                      autoComplete="address-line1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Address Line 2
                    </label>
                    <input
                      className="input-civic"
                      placeholder="Apartment, building, or landmark (optional)"
                      value={addressLine2}
                      onChange={(e) => {
                        setManualAddressCandidate(null);
                        updateAddress({ addressLine2: e.target.value });
                      }}
                      autoComplete="address-line2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Dublin Area
                      </label>
                      <select
                        className="input-civic"
                        value={area}
                        onChange={(e) => handleDublinAreaChange(e.target.value)}
                      >
                        <option value="">Select Dublin Area</option>
                        {dublinAreas.map((areaOption) => (
                          <option key={areaOption} value={areaOption}>
                            {areaOption}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Local Area
                      </label>
                      <select
                        className="input-civic"
                        value={suburb}
                        onChange={(e) => {
                          setManualAddressCandidate(null);
                          updateAddress({ suburb: e.target.value });
                        }}
                        disabled={!area}
                      >
                        <option value="">Select Local Area</option>
                        {localAreaOptions.map((localArea) => (
                          <option key={localArea} value={localArea}>
                            {localArea}
                          </option>
                        ))}
                      </select>
                    </div>
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

                {manualAddressCandidate && (
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        We found this address
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        {manualAddressCandidate.formatted || "Address found"}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Please confirm if this matches the address you entered.
                    </p>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleAcceptManualAddressCandidate}
                        className="btn-primary-civic w-full"
                      >
                        Yes, confirm this address
                      </button>

                      <button
                        type="button"
                        onClick={handleRejectManualAddressCandidate}
                        className="btn-outline-civic w-full"
                      >
                        No, try again
                      </button>

                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locationLoading}
                        className="text-sm text-primary hover:underline w-full text-center"
                      >
                        Use current location instead
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {isConfirmedMode && (
              <>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Address
                    </p>
                    <p className="text-sm text-foreground mt-1">{summaryAddress1}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Dublin Area
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
              <p className="text-xs text-primary text-center">{locationMessage}</p>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
          <SectionCard bodyClassName="space-y-4">
            <h3 className="section-title">Upload Photo</h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />

            <div className="issue-photo-upload">
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt="Issue preview"
                  className="issue-photo-preview"
                />
              ) : (
                <div className="issue-photo-empty">
                  <ImagePlus className="issue-photo-empty__icon" />
                  <p className="issue-photo-empty__title">Snap it or pick one from your phone</p>
                  <p className="issue-photo-empty__text">
                    Show us what you're seeing — any photo helps
                  </p>
                  <p className="issue-photo-empty__text-optional">
                    Skip if no photo is available.
                  </p>

                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenPhotoPicker}
              className="btn-secondary-civic flex items-center gap-2 w-full justify-center"
            >
              <Camera className="w-4 h-4" />
              {photoFile ? "Retake Photo" : "Take a Photo"}
            </button>

            {photoFile && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn-outline-civic flex-1 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove Photo
                </button>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

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
    </CitizenLayout>
  );
};

export default ReportIssuePage;
