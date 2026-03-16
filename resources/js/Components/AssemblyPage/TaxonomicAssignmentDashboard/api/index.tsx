import axios from 'axios';
import {DiamondRow} from "@/Components/AssemblyPage/TaxonomicAssignmentDashboard/api/interfaces";

const userID = 2;
const GNOM_HEADLESS = '/plugin/taxaminer';

// ===== FETCH TAXAMINER ANALYSES BY ASSEMBLY ID ===== //
export async function fetchTaXaminerAnalysesByAssemblyID(assemblyID: number): Promise<any[]> {
    return axios
        .get(GNOM_HEADLESS + '/fetchTaXaminerAnalysesByAssemblyID?assemblyID=' + assemblyID + '&userID=' + userID)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Taxaminer Main ==== //
export function fetchTaxaminerMain(assembly_id: number, taxaminer_id: number): Promise<any> {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/main?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

/**
 * Fetch the diamond hits of a given ID of a given dataset
 * @param base_url API base url
 * @param dataset_id dataset id
 * @param fasta_header fasta id (string)
 * @returns list of rows as JSON objects
 */
export function fetchDiamond(base_url: string, dataset_id: number, fasta_header: string): Promise<DiamondRow[]> {
    return fetch(`${GNOM_HEADLESS}/taxaminer/diamond?id=${dataset_id}&fasta_id=${fasta_header}`)
        .then(response => response.json())
        .then(data => data)
        .catch((error) => {
            console.error(error);
        });
}


// ==== Taxaminer Metadata ==== //
export function fetchTaxaminerMetadata(assembly_id: number, taxaminer_id: number) {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/summary?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Taxaminer Plot data ==== //
export function fetchTaxaminerScatterplot(assembly_id: number, taxaminer_id: number): Promise<any[]> {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/scatterplot?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Taxaminer PCA data ==== //
export function fetchTaxaminerPCA(assembly_id: number, taxaminer_id: number): Promise<any> {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/pca_contribution?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Taxaminer Diamond data ==== //
export function fetchTaxaminerDiamond(assembly_id: number, taxaminer_id: number, fasta_id: number): Promise<any> {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/diamond?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&qseqID=${fasta_id}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Taxaminer Sequence data ==== //
export function fetchTaxaminerSeq(assembly_id: number, taxaminer_id: number, fasta_id: string): Promise<any> {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/seq?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&fastaID=${fasta_id}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== fetch taXaminer user settings ==== //
export function fetchTaxaminerSettings(assembly_id: number, analysisID: number): Promise<any> {
    return axios
        .get(`${GNOM_HEADLESS}/taxaminer/userconfig?assemblyID=${assembly_id}&analysisID=${analysisID}&userID=${userID}`)
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Update taXaminer user settings ==== //
export function updateTaxaminerSettings(assembly_id: number, taxaminer_id: number, fields: any[], selection: string[]): Promise<any> {
    // JSON body
    const my_body = {
        fields: fields,
        selection: selection,
    };
    return axios
        .put(`${GNOM_HEADLESS}/taxaminer/userconfig?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&userID=${userID}`, {
            body: JSON.stringify(my_body),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((response) => response.data)
        .then((data) => data);
}

// ==== Taxaminer FASTA download ==== //
export function fetchTaxaminerDownload(assembly_id: number, taxaminer_id: number, type: string, genes: any): Promise<any> {
    // JSON body
    const my_body = {
        genes: Array.from(genes),
    };
    return fetch(`${GNOM_HEADLESS}/taxaminer/download/fasta?assemblyID=${assembly_id}&analysisID=${taxaminer_id}&userID=${userID}`, {
        method: 'POST',
        body: JSON.stringify(my_body),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((res) => {
            return res.blob();
        })
        .catch((error) => {
            console.error(error);
            return [];
        });
}

/**
 * Fetch a .fasta file blob
 * @param base_url API base URL
 * @param dataset_id dataset id
 * @param body request body
 * @returns Promise
 */
export function getFastaDownload(base_url: string, dataset_id: number, body: any) {
    return fetch(`http://${base_url}:5500/download/fasta?id=${dataset_id}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((res) => { return res.blob(); })
}
