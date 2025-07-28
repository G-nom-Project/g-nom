import axios from "axios";

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
