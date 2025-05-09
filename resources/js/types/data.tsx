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
