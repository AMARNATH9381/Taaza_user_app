// Type declarations for Google Maps JavaScript API
declare namespace google {
    namespace maps {
        class Map {
            constructor(mapDiv: Element, opts?: MapOptions);
            setCenter(latLng: LatLng | LatLngLiteral): void;
            getCenter(): LatLng;
            setZoom(zoom: number): void;
        }

        class Marker {
            constructor(opts?: MarkerOptions);
            setPosition(latLng: LatLng | LatLngLiteral): void;
            getPosition(): LatLng | null;
            setMap(map: Map | null): void;
            addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
        }

        class LatLng {
            constructor(lat: number, lng: number);
            lat(): number;
            lng(): number;
        }

        class Geocoder {
            geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
        }

        interface MapOptions {
            center?: LatLng | LatLngLiteral;
            zoom?: number;
            disableDefaultUI?: boolean;
            zoomControl?: boolean;
            styles?: MapTypeStyle[];
        }

        interface MarkerOptions {
            position: LatLng | LatLngLiteral;
            map: Map;
            draggable?: boolean;
            animation?: Animation;
        }

        interface LatLngLiteral {
            lat: number;
            lng: number;
        }

        interface GeocoderRequest {
            location?: LatLng | LatLngLiteral;
            address?: string;
        }

        interface GeocoderResult {
            formatted_address: string;
            address_components: AddressComponent[];
        }

        interface AddressComponent {
            long_name: string;
            short_name: string;
            types: string[];
        }

        type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

        interface MapTypeStyle {
            featureType?: string;
            elementType?: string;
            stylers?: { [key: string]: any }[];
        }

        interface MapsEventListener {
            remove(): void;
        }

        enum Animation {
            BOUNCE = 1,
            DROP = 2
        }
    }
}

interface Window {
    google?: typeof google;
}
