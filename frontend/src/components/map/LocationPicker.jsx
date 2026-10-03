import { useEffect, useState } from "react";
import {
    Check,
    Crosshair,
    Loader2,
    X,
} from "lucide-react";

import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [18.5204, 73.8567];
const DEFAULT_ZOOM = 15;

/* -------------------------------------------------- */
/* Marker */
/* -------------------------------------------------- */

const locationIcon = L.divIcon({
    className: "",
    html: `
        <div
            style="
                width: 34px;
                height: 34px;
                border-radius: 50% 50% 50% 0;
                background: #d8f34a;
                border: 3px solid #232224;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            "
        >
            <div
                style="
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #232224;
                "
            ></div>
        </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
});

/* -------------------------------------------------- */
/* Browser location */
/* -------------------------------------------------- */

const getCurrentBrowserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(
                new Error(
                    "Geolocation is not supported by this browser."
                )
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};

/* -------------------------------------------------- */
/* Map resize + focus controller */
/* -------------------------------------------------- */

const MapController = ({ focusLocation }) => {
    const map = useMap();

    /* Fix Leaflet sizing when modal opens */
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => clearTimeout(timer);
    }, [map]);

    /* Move map when focus location changes */
    useEffect(() => {
        if (!focusLocation) return;

        map.setView(focusLocation, DEFAULT_ZOOM, {
            animate: true,
        });
    }, [focusLocation, map]);

    return null;
};

/* -------------------------------------------------- */
/* Marker + map click handler */
/* -------------------------------------------------- */

const MapLocationSelector = ({
    position,
    setPosition,
}) => {
    useMapEvents({
        click(event) {
            const newPosition = [
                event.latlng.lat,
                event.latlng.lng,
            ];

            setPosition(newPosition);
        },
    });

    if (!position) return null;

    return (
        <Marker
            position={position}
            icon={locationIcon}
            draggable={true}
            eventHandlers={{
                dragend(event) {
                    const marker = event.target;
                    const { lat, lng } =
                        marker.getLatLng();

                    setPosition([lat, lng]);
                },
            }}
        />
    );
};

/* -------------------------------------------------- */
/* Location Picker */
/* -------------------------------------------------- */

export default function LocationPicker({
    open,
    onClose,
    onConfirm,
    initialLocation = null,
}) {
    const [position, setPosition] =
        useState(null);

    const [focusLocation, setFocusLocation] =
        useState(null);

    const [loadingLocation, setLoadingLocation] =
        useState(false);

    const [locationError, setLocationError] =
        useState("");

    /* ------------------------------------------------ */
    /* Initialize location when modal opens */
    /* ------------------------------------------------ */

    useEffect(() => {
        if (!open) return;

        setLocationError("");

        /*
         * If user already selected a location,
         * preserve that location.
         */
        if (initialLocation) {
            const selected = [
                initialLocation.latitude,
                initialLocation.longitude,
            ];

            setPosition(selected);
            setFocusLocation(selected);

            return;
        }

        let cancelled = false;

        const loadCurrentLocation = async () => {
            setLoadingLocation(true);

            try {
                const current =
                    await getCurrentBrowserLocation();

                if (cancelled) return;

                const currentPosition = [
                    current.latitude,
                    current.longitude,
                ];

                setPosition(currentPosition);
                setFocusLocation(currentPosition);
            } catch (error) {
                if (cancelled) return;

                console.error(
                    "Location access failed:",
                    error
                );

                /*
                 * Fallback to Pune.
                 * User can manually select another location.
                 */
                setPosition(DEFAULT_CENTER);
                setFocusLocation(DEFAULT_CENTER);

                setLocationError(
                    "Unable to access your current location. You can select a location manually."
                );
            } finally {
                if (!cancelled) {
                    setLoadingLocation(false);
                }
            }
        };

        loadCurrentLocation();

        return () => {
            cancelled = true;
        };
    }, [open, initialLocation]);

    if (!open) return null;

    /* ------------------------------------------------ */
    /* Focus current location */
    /* ------------------------------------------------ */

    const focusOnCurrentLocation = async () => {
        setLoadingLocation(true);
        setLocationError("");

        try {
            const current =
                await getCurrentBrowserLocation();

            const currentPosition = [
                current.latitude,
                current.longitude,
            ];

            setPosition(currentPosition);
            setFocusLocation(currentPosition);
        } catch (error) {
            console.error(
                "Unable to access current location:",
                error
            );

            setLocationError(
                "Unable to access your current location."
            );
        } finally {
            setLoadingLocation(false);
        }
    };

    /* ------------------------------------------------ */
    /* Confirm */
/* -------------------------------------------------- */

    const handleConfirm = () => {
        if (!position) return;

        onConfirm({
            latitude: position[0],
            longitude: position[1],
        });

        onClose();
    };

    /* ------------------------------------------------ */
    /* UI */
    /* ------------------------------------------------ */

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                /*
                 * Close only when clicking the backdrop.
                 * Clicking anywhere inside the card does nothing.
                 */
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-xl"
                onMouseDown={(e) =>
                    e.stopPropagation()
                }
            >
                {/* ---------------------------------- */}
                {/* Header */}
                {/* ---------------------------------- */}

                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-ink">
                            Select Emergency Location
                        </h2>

                        <p className="text-sm text-ink-muted">
                            Drag the marker or click anywhere
                            on the map
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition hover:bg-card-muted hover:text-ink"
                        aria-label="Close location picker"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ---------------------------------- */}
                {/* Map */}
                {/* ---------------------------------- */}

                <div className="relative h-[420px] w-full">
                    <MapContainer
                        center={
                            position ||
                            DEFAULT_CENTER
                        }
                        zoom={DEFAULT_ZOOM}
                        className="!h-full !w-full"
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapController
                            focusLocation={
                                focusLocation
                            }
                        />

                        <MapLocationSelector
                            position={position}
                            setPosition={(newPosition) => {
                                setPosition(
                                    newPosition
                                );
                                setFocusLocation(
                                    newPosition
                                );
                            }}
                        />
                    </MapContainer>

                    {/* Focus current location button */}
                    <button
                        type="button"
                        onClick={
                            focusOnCurrentLocation
                        }
                        disabled={loadingLocation}
                        className="absolute right-4 top-4 z-[1000] grid h-10 w-10 place-items-center rounded-full bg-card text-ink shadow-md transition hover:bg-card-muted disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Use current location"
                    >
                        {loadingLocation ? (
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Crosshair size={18} />
                        )}
                    </button>
                </div>

                {/* ---------------------------------- */}
                {/* Location error */}
                {/* ---------------------------------- */}

                {locationError && (
                    <div className="border-t border-line bg-card-muted px-5 py-2">
                        <p className="text-xs text-ink-muted">
                            {locationError}
                        </p>
                    </div>
                )}

                {/* ---------------------------------- */}
                {/* Footer */}
                {/* ---------------------------------- */}

                <div className="flex flex-col gap-3 border-t border-line bg-card-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-mono text-sm text-ink-muted">
                        {position
                            ? `${position[0].toFixed(
                                  5
                              )}, ${position[1].toFixed(
                                  5
                              )}`
                            : "No location selected"}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-card"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!position}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check size={16} />
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}