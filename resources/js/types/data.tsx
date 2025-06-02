
export interface Assembly {
    id: number
    name: string
    infoText: string | null
    taxon_id: number
    addedBy: number
    public: boolean
    numberOfSequences: number
    cumulativeSequenceLength: number
    n50: number
    n90: number
    shortestSequence: number
    longestSequence: number
    medianSequence: number
    meanSequence: number
    gcPercent: number
    gcPercentMasked: number
    lengthDistributionString: string
    charCount: string
    label: string | null
    created_at: string
    updated_at: string
}


export interface Taxon {
    assemblies: Assembly[]
    commonName: string | null
    created_at: string
    id: number
    imageCredit: string | null
    imagePath: string | null
    ncbiTaxonID: number
    parentNcbiTaxonID: number
    scientificName: string
    taxonRank: string
    updated_at: string
}


export interface Annotation {
    addedBy: number;
    addedOn: Date;
    assemblyID: number;
    id: number;
    name: string;
    path: string;
    featureCount: string;
    username: string;
    label?: string;
}

export interface Mapping {
    addedBy: number;
    addedOn: Date;
    assemblyID: number;
    id: number;
    name: string;
    path: string;
    username: string;
    label?: string;
}
