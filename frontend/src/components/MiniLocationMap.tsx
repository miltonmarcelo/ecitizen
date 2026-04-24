import { useEffect, useRef } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MiniLocationMapProps = {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
};

const MiniLocationMap = ({
  latitude,
  longitude,
  onLocationChange,
}: MiniLocationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  // Prevents marker drag callback from firing when marker is moved by props update.
  const suppressNextDragRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [longitude, latitude],
      zoom: 17,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");

    const marker = new maplibregl.Marker({
      draggable: true,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    marker.on("dragend", () => {
      if (suppressNextDragRef.current) {
        suppressNextDragRef.current = false;
        return;
      }

      const lngLat = marker.getLngLat();
      // Returns updated coordinates to parent form after user drags the pin.
      onLocationChange(lngLat.lat, lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [latitude, longitude, onLocationChange]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const current = markerRef.current.getLngLat();
    const sameLat = Math.abs(current.lat - latitude) < 0.000001;
    const sameLng = Math.abs(current.lng - longitude) < 0.000001;

    if (sameLat && sameLng) return;

    // Moves marker from external state changes and skips one drag callback loop.
    suppressNextDragRef.current = true;
    markerRef.current.setLngLat([longitude, latitude]);
    mapRef.current.easeTo({
      center: [longitude, latitude],
      duration: 500,
    });
  }, [latitude, longitude]);

  return (
    <div
        className="rounded-xl overflow-hidden border border-border w-full"
        style={{ height: "320px" }}
    >
        <div ref={mapContainerRef} className="h-full w-full" />
    </div>
    );
};

export default MiniLocationMap;
