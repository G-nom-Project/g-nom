export interface Assembly {
    id: number;
    name: string;
    infoText: string | null;
    taxon_id: number;
    addedBy: number;
    public: boolean;
    numberOfSequences: number;
    cumulativeSequenceLength: number;
    n50: number;
    n90: number;
    shortestSequence: number;
    longestSequence: number;
    medianSequence: number;
    meanSequence: number;
    gcPercent: number;
    gcPercentMasked: number;
    lengthDistributionString: string;
    charCount: string;
    label: string | null;
    created_at: string;
    updated_at: string;
    mappings_count?: number;
}

export interface AggregatedAssembly {
    id: number;
    name: string;
    infoText: string | null;
    taxon_ncbiTaxonID: number;
    taxon: TaxonData;
    addedBy: number;
    public: boolean;
    numberOfSequences: number;
    cumulativeSequenceLength: number;
    n50: number;
    n90: number;
    shortestSequence: number;
    longestSequence: number;
    medianSequence: number;
    meanSequence: number;
    gcPercent: number;
    gcPercentMasked: number;
    lengthDistributionString: string;
    charCount: string;
    label: string | null;
    created_at: string;
    updated_at: string;
    mappings_count: number;
    genomic_annotations_count: number;
    busco_analyses_count: number;
    repeatmasker_analyses_count: number;
    taxaminer_analyses_count: number;
}

export interface TaxonInfos {
    ncbiTaxonID: number;
    headline: string | null;
    text: string | null;
}

export interface TaxonData {
    assemblies: Assembly[];
    commonName: string | null;
    created_at: string;
    id: number;
    imageCredit: string | null;
    imagePath: string | null;
    ncbiTaxonID: number;
    parentNcbiTaxonID: number;
    scientificName: string;
    taxonRank: string;
    updated_at: string;
    infos: TaxonInfos[] | null;
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

export interface SeqLengthMarker {
    x: string[];
    y: number[];
    mode: string;
    type: string;
    yaxis: string;
    opacity: number;
    name: string;
    marker: { color: string };
}

export interface BuscoAnalysis {
    label: string;
    name: string;
    dataset: string;
    completeSingle: number;
    completeDuplicated: number;
    fragmented: number;
    missing: number;
}
