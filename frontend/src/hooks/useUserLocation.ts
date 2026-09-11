import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STORAGE_KEY = "payent:user_city";
const AUTO_DETECTED_KEY = "payent:location_autodetected";

// Standard canonical city naming cleanup
function cleanCityName(raw: string): string {
  if (!raw) return "";
  let name = raw.trim();
  // Remove administrative suffixes if present
  name = name.replace(/\s+(District|Division|Mandal|Taluk|Corporation|City)$/i, "").trim();
  if (name.toLowerCase() === "new delhi" || name.toLowerCase() === "delhi") return "Delhi NCR";
  if (name.toLowerCase() === "bangalore") return "Bengaluru";
  return name;
}

export function useUserLocation() {
  const { user } = useAuth();
  const [city, setCityState] = useState<string>(() => {
    if (typeof window === "undefined") return "Location unavailable";
    // 1. Check logged-in user profile
    if (user?.city) return cleanCityName(user.city);
    // 2. Check cached previously detected city
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && cached !== "All Cities" && cached !== "Hyderabad") return cached;
    return "Location unavailable";
  });

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTO_DETECTED_KEY) === "true";
  });

  const hasAutoAttempted = useRef<boolean>(false);

  const setCity = useCallback((newCity: string) => {
    setCityState(newCity);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newCity);
      localStorage.setItem(AUTO_DETECTED_KEY, "false");
      setIsAutoDetected(false);
    }
  }, []);

  // IP-based Geolocation Fallback
  const detectViaIP = useCallback(async (): Promise<string | null> => {
    try {
      // Try ipapi.co first
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.city) {
          return cleanCityName(data.city);
        }
      }
    } catch {
      // Fallback to ipwho.is if ipapi fails
      try {
        const res2 = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4000) });
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2.city) {
            return cleanCityName(data2.city);
          }
        }
      } catch {
        // Ignored
      }
    }
    return null;
  }, []);

  // Reverse geocode coordinates via backend -> Nominatim fallback
  const reverseGeocodeCoords = useCallback(async (latitude: number, longitude: number): Promise<string | null> => {
    // 1. Try backend reverse-geocode
    try {
      const backendRes = await api.reverseGeocode(null, latitude, longitude);
      if (backendRes && backendRes.city) {
        return cleanCityName(backendRes.city);
      }
      if (backendRes && backendRes.state) {
        return cleanCityName(backendRes.state);
      }
    } catch (err) {
      console.warn("Backend reverse-geocode notice:", err);
    }

    // 2. Try Nominatim directly
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Payent-App/1.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const rawCity = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.county || addr.state;
        if (rawCity) {
          return cleanCityName(rawCity);
        }
      }
    } catch (err) {
      console.warn("Nominatim reverse-geocode notice:", err);
    }

    // 3. Try BigDataCloud
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const res = await fetch(bdcUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const rawCity = data.city || data.locality || data.principalSubdivision;
        if (rawCity) {
          return cleanCityName(rawCity);
        }
      }
    } catch {
      // Ignored
    }

    return null;
  }, []);

  // Main Detection Function
  const detectLocation = useCallback(
    async (showToast = false): Promise<string | null> => {
      setIsDetecting(true);
      if (showToast) {
        toast.info("Detecting your current location...");
      }

      // Check user profile city if logged in
      if (user?.city) {
        const cleaned = cleanCityName(user.city);
        setCityState(cleaned);
        setIsAutoDetected(true);
        setIsDetecting(false);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, cleaned);
          localStorage.setItem(AUTO_DETECTED_KEY, "true");
        }
        if (showToast) {
          toast.success(`Location set from your profile: ${cleaned}`);
        }
        return cleaned;
      }

      // 1. Try Browser Geolocation
      if (typeof window !== "undefined" && navigator.geolocation) {
        const geoPromise = new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            maximumAge: 1000 * 60 * 30, // 30 minutes cached coords
            enableHighAccuracy: true,
          });
        });

        try {
          const pos = await geoPromise;
          const detectedCity = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
          if (detectedCity) {
            setCityState(detectedCity);
            setIsAutoDetected(true);
            setIsDetecting(false);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, detectedCity);
              localStorage.setItem(AUTO_DETECTED_KEY, "true");
            }
            if (showToast) {
              toast.success(`Location detected: ${detectedCity}`);
            }
            return detectedCity;
          }
        } catch (geoErr) {
          console.warn("Geolocation permission or timeout notice:", geoErr);
        }
      }

      // 2. Fallback to IP Geolocation
      try {
        const ipCity = await detectViaIP();
        if (ipCity) {
          setCityState(ipCity);
          setIsAutoDetected(true);
          setIsDetecting(false);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, ipCity);
            localStorage.setItem(AUTO_DETECTED_KEY, "true");
          }
          if (showToast) {
            toast.success(`Location detected: ${ipCity}`);
          }
          return ipCity;
        }
      } catch (ipErr) {
        console.warn("IP Geolocation notice:", ipErr);
      }

      // If all fails or permission denied -> graceful fallback
      setIsDetecting(false);
      const fallbackLocation = user?.city ? cleanCityName(user.city) : "Location unavailable";
      setCityState(fallbackLocation);
      if (showToast) {
        toast.info("Location permission denied or unavailable.");
      }
      return null;
    },
    [user?.city, reverseGeocodeCoords, detectViaIP],
  );

  // Automatically attempt location detection once on initial mount
  useEffect(() => {
    if (typeof window === "undefined" || hasAutoAttempted.current) return;
    hasAutoAttempted.current = true;
    detectLocation(false);
  }, [detectLocation]);

  return {
    city,
    setCity,
    isDetecting,
    isAutoDetected,
    detectLocation,
  };
}
