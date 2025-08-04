import axios from "axios";

export interface GeoJSONImport {
    name: string
    type: string
    description: string | null
    source_link: string
    data_link: string
    data: string
}

/**
 * Fetch all GeoJSON data associated with the given NCBI ID
 * @param ncbiTaxonID
 */
export const getGeoData = async (ncbiTaxonID: number) => {
    try {
        const response = await axios.get(`/taxon-geo-data/${ncbiTaxonID}`);
        return response.data;
    } catch (error) {
        console.error('Failed to geo data:', error);
        throw error;
    }
};

/**
 * Fetch all info-texts associated with the given NCBI ID
 * @param ncbiTaxonID
 */
export const getTaxonInfo = async (ncbiTaxonID: number) => {
    try {
        const response = await axios.get(`/taxon/infos/${ncbiTaxonID}`);
        return response
    } catch (error) {
        console.error('Failed to geo data:', error);
        throw error;
    }
};

/**
 * Retrieve the lineage of a given NCBI ID
 * @param ncbiTaxonID
 */
export const getLineage = async (ncbiTaxonID: number) => {
    try {
        const response = await axios.get(`/lineage/${ncbiTaxonID}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch lineage:', error);
        throw error;
    }
};

/**
 * Upload new GeoJSON data
 * @param taxonID
 * @param data
 */
export const uploadGeoData = async (taxonID: number, data: GeoJSONImport) => {
    try {
        const response = await axios.post(`/taxon/${taxonID}/geodata`, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to upload GeoData:', error);
        throw error;
    }
};


export const deleteGeoData = async (id: number, taxonID: number) => {
    try {
        const response = await axios.delete(`/taxon/${taxonID}/geodata/${id}/`);
        return response.data;
    } catch (error) {
        console.error('Failed to upload GeoData:', error);
        throw error;
    }
}
