import React, { useEffect, useRef, useState } from 'react';
import {GeoJSON, MapContainer, Popup, TileLayer} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type TaxMapProps = {
    isVisible: boolean;
    geoDataMeta: any
};


const TaxMap: React.FC<TaxMapProps> = ({ isVisible, geoDataMeta }) => {
    const [geoData, setGeoData] = useState<any>(null);
    const mapRef = useRef<L.Map | null>(null);

    // Load GeoJSON on mount
    useEffect(() => {
        async function loadAllGeoJson() {
            if (!geoDataMeta || geoDataMeta.length === 0) return;

            try {
                const allData = await Promise.all(
                    geoDataMeta.map(async (each) => {
                        // Dynamically load external data if no local data is available
                        if (!each.data) {
                            const res = await fetch(each.data_link);
                            each['data'] = await res.json();
                        } else {
                            console.log(each.data)
                            if (typeof each.data == "string") {
                                each['data'] = JSON.parse(each['data'])
                            }

                        }
                        console.log(each.data)
                        return each
                    })
                );
                setGeoData(allData);
                const center = L.geoJson(allData[0].data)
                console.log(center)
                // mapRef.fitBounds(center)
            } catch (err) {
                console.error('Failed to load one or more GeoJSON files:', err);
            }
        }

        loadAllGeoJson();
    }, [geoDataMeta]);

    // Invalidate size when tab becomes visible, ensures proper rendering
    useEffect(() => {
        if (isVisible && mapRef.current) {
            setTimeout(() => {
                mapRef.current?.invalidateSize();
            }, 200);
        }
    }, [isVisible]);


    // When GeoData has been loaded, fit the make to it's bounds automatically
    useEffect(() => {
        if (!mapRef.current || !geoData || geoData.length === 0) return;

        // Combine all bounds from each GeoJSON feature
        const allBounds = geoData.reduce((bounds, each) => {
            const geoJsonLayer = L.geoJSON(each.data);
            return bounds.extend(geoJsonLayer.getBounds());
        }, L.latLngBounds());

        mapRef.current.fitBounds(allBounds, { padding: [20, 20] });
    }, [geoData]);

    return (
        <MapContainer
            center={[40, -40]}
            zoom={1}
            style={{ height: '100%', width: '100%' }}
            whenReady={(map) => {
                mapRef.current = map.target;
            }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            {geoData && geoData.map(each => {
                return <GeoJSON data={each.data}>
                    <Popup><b>{each.name}</b>{each.description && <><br/>{each.description}</>}</Popup>
                </GeoJSON>
                })
            }
        </MapContainer>
    );
};

export default TaxMap;
