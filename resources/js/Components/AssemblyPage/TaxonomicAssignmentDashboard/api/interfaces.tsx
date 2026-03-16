/** One entry in a diamond result table */
export interface DiamondRow {
    sseqid: string,
    evalue: number,
    bitscore: number,
    ssciname: string,
    qseqid: string,
    pident: number,
    length: number,
    mismatch: number,
    gapopen: number,
    qstart: number,
    qend: number,
    sstart: number,
    send: number,
    staxids: string
}

/** Mapping a string to a color value **/
interface colorDict {
    [key: string]: string | undefined
}

/** Basic dict type **/
export interface dictType {
    [key: string]: string | number | undefined
}

/**
 * Representation of bootstrap-table-next table column
 */
export interface tableCol {
    /**Common ID */
    dataField: string,
    /**Column name */
    text: string,
    /**Sortable */
    sort: boolean,
    /**Optional filter function */
    filter?: any | undefined
}
