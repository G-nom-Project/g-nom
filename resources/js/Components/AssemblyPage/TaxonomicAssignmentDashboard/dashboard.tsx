import React from 'react';
import { Card, Tab, Tabs } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/esm/Container';
import Row from 'react-bootstrap/Row';
import Scatter3D from './scatterplot3d/scatter3d';
import { DataSetMeta } from './sidebar/DataSet/dataset_metadata';
import { DataSetSelector } from './sidebar/DataSet/dataset_selector';
import Table from './sidebar/DiamondTable/diamondtable';
import { FilterUI } from './sidebar/Filters/filterui';
import PCAPlot from './sidebar/PCAPlot/PCAPlot';
import ScatterMatrix from './sidebar/ScatterMatrix/ScatterMatrix';
import SelectionView from './sidebar/selection/selection';

// Stylesheet
import {
    fetchTaxaminerScatterplot,
    fetchTaxaminerSeq,
    fetchTaxaminerSettings,
    updateTaxaminerSettings,
} from './api';
import { TableView } from './tableview';

interface State {
    analysis: any;
    dataset_id: number;
    selected_row: any;
    contigs: any[];
    aa_seq: string;
    camera: any;
    select_mode: string;
    selected_data: Set<string>;
    data: any;
    e_value: any;
    filters: any;
    scatter_data: any;
    legend_only: string[];
    userID: number;
    token: string;
    fields: string[];
    g_options: any[];
    customFields: any[];
    is_loading: boolean;
    scatterPoints: any[];
    highlightedGenes: Set<string>;
    highlightMode: boolean;
    genomeBrowserInteraction: boolean;

    // Backward compatibility
    gene_order_supported: boolean;
    gene_pos_supported: boolean;
    dim_string: string;
    fasta_col: string;
}

interface Props {
    assembly_id: number;
    analyses: any[];
    setLocation: Function;
    setAutoScroll: Function;
    userID: number;
}

interface Option {
    label: string;
    value: string;
}

const default_selected_row = {
    g_name: 'Pick a gene',
    taxonomic_assignment: 'Pick a gene',
    plot_label: 'Pick a gene',
    best_hit: 'Pick a gene',
    c_name: 'Pick a gene',
    bh_evalue: 0,
    best_hitID: 'None',
    upstream_gene: '',
    downstream_gene: '',
};

class TaxaminerDashboard extends React.Component<Props, State> {
    // Set up states for loading data
    constructor(props: any) {
        super(props);

        this.state = {
            analysis: {},
            dataset_id: 1,
            selected_row: default_selected_row,
            aa_seq: 'Pick a gene',
            camera: null,
            select_mode: 'neutral',
            selected_data: new Set(),
            data: {},
            scatter_data: { colors: 'rainbow', legendonly: [] },
            e_value: 1.0,
            filters: { e_value: 1.0, show_unassinged: true, g_searched: [] },
            legend_only: [],
            userID: this.props.userID,
            token: this.props.token,
            fields: [],
            g_options: [],
            customFields: [],
            scatterPoints: [],
            is_loading: false,
            contigs: [],
            highlightedGenes: new Set<string>(),
            highlightMode: false,
            genomeBrowserInteraction: false,

            // Backward compatible
            gene_order_supported: true,
            gene_pos_supported: true,
            dim_string: 'PC_',
            fasta_col: 'fasta_header',
        };

        // Bind functions passing data from child objects to local context
        this.setDataset = this.setDataset.bind(this);
        this.handleDataClick = this.handleDataClick.bind(this);
        this.resetSelection = this.resetSelection.bind(this);
        this.setHighlightedGenes = this.setHighlightedGenes.bind(this);
        this.setHighlightMode = this.setHighlightMode.bind(this);
        this.setGenomeBrowserInteraction =
            this.setGenomeBrowserInteraction.bind(this);
    }

    /**
     * Update dataset ID and reload data
     * @param id dataset ID
     */
    setDataset(id: number) {
        this.setState({ is_loading: true });
        this.setState({ dataset_id: id }, () => {
            fetchTaxaminerScatterplot(
                this.props.assembly_id,
                id,
                this.state.userID,
                this.state.token,
            )
                .then((data) => {
                    const main_data = {};
                    this.setState({ scatterPoints: data }, () => {
                        let final_row = {};
                        for (const chunk of data as unknown as any[]) {
                            for (const row of chunk) {
                                const key = row.g_name as string;
                                (main_data as any)[key] = row;
                                final_row = row;
                            }
                        }
                        this.setState({
                            data: main_data,
                            gene_order_supported:
                                Object.prototype.hasOwnProperty.call(
                                    final_row,
                                    'upstream_gene',
                                ),
                            gene_pos_supported:
                                Object.prototype.hasOwnProperty.call(
                                    final_row,
                                    'end',
                                ),
                        });

                        // Make backwards compatible
                        if (
                            Object.prototype.hasOwnProperty.call(
                                final_row,
                                'Dim.1',
                            ) &&
                            this.state.dim_string === 'PC_'
                        ) {
                            this.setState({ dim_string: 'Dim.' });
                        } else if (
                            Object.prototype.hasOwnProperty.call(
                                final_row,
                                'PC_1',
                            ) &&
                            this.state.dim_string === 'Dim.'
                        ) {
                            this.setState({ dim_string: 'PC_' });
                        }

                        if (
                            Object.prototype.hasOwnProperty.call(
                                final_row,
                                'protID',
                            )
                        ) {
                            this.setState({ fasta_col: 'protID' });
                        }

                        fetchTaxaminerSettings(
                            this.props.assembly_id,
                            this.state.dataset_id,

                        ).then((settings) => {
                            const selection_array = settings['selection'];
                            // @ts-ignore
                            this.setState({
                                selected_data: new Set(selection_array),
                            });
                        });

                        // Infer fields from first row
                        if (main_data) {
                            const proto_row = (main_data as any)[
                                Object.keys(main_data)[0]
                            ];
                            this.setState({ fields: Object.keys(proto_row) });
                        }

                        //const gene_options: { label: string; value: string; }[] = []
                        const gene_options: string[] = Object.keys(
                            main_data,
                        ).map((item: string) => {
                            return item;
                        });

                        /**
                         * Extract unique contig identifiers
                         */
                        const contigs = new Set();
                        for (const key of Object.keys(main_data)) {
                            const item =
                                main_data[key as keyof typeof main_data];
                            contigs.add(item['c_name']);
                        }

                        // convert set to list
                        const contig_options: Option[] = [];
                        contigs.forEach((each: any) =>
                            contig_options.push({ label: each, value: each }),
                        );

                        this.setState({
                            contigs: contig_options,
                            g_options: gene_options,
                            selected_row: default_selected_row,
                        });
                    });
                })
                .finally(() => {
                    this.setState({ is_loading: false });
                });
        });
    }

    /**
     * Call this everytime a click event referring to a datapoint's key in the primary table occurs
     * @param newRow new data row
     * @param new_seq
     */
    handleDataClick(keys: string[]) {
        const new_row = this.state.data[keys[0]];
        if (new_row !== undefined) {
            this.setState({ selected_row: this.state.data[keys[0]] });

            // format coordinates for JBrowse
            if (
                this.state.gene_pos_supported &&
                this.state.genomeBrowserInteraction
            ) {
                const coords = `${new_row.c_name}:${new_row.start}..${new_row.end}`;
                console.log(coords);
                this.props.setLocation(coords);
            }
        }

        // Process if highlight mode is enabled
        if (this.state.highlightMode) {
            keys.forEach((key) => {
                if (this.state.highlightedGenes.has(key)) {
                    this.state.highlightedGenes.delete(key);
                } else {
                    this.state.highlightedGenes.add(key);
                }
            });
            this.setState({
                filters: {
                    e_value: this.state.filters.e_value,
                    show_unassinged: this.state.filters.show_unassinged,
                    g_searched: Array.from(this.state.highlightedGenes),
                    c_searched: this.state.filters.c_searched,
                },
            });
        } else {
            if (this.state.select_mode === 'add') {
                keys.forEach((key) => this.state.selected_data.add(key));
                // this.state.selected_data.concat(key)
            } else if (this.state.select_mode === 'remove') {
                keys.forEach((key) => this.state.selected_data.delete(key));
                //this.state.selected_data.delete(key)
            }
        }

        fetchTaxaminerSeq(
            this.props.assembly_id,
            this.state.dataset_id,
            this.state.data[keys[0]][this.state.fasta_col],
        ).then((data) => {
            this.setState({ aa_seq: data as unknown as string });
        });

        if (this.state.select_mode !== 'neutral') {
            updateTaxaminerSettings(
                this.props.assembly_id,
                this.state.dataset_id,
                this.state.customFields,
                Array.from(this.state.selected_data),
            );
        }
    }

    /**
     * Pass the camera position from the main scatterplot
     * @param childData camera data (Plotly)
     */
    callbackFunction = (childData: any) => {
        this.setState({ camera: childData });
    };

    /**
     * Set the current selection mode globally
     * @param new_mode 'add','remove' odr 'neutral'
     */
    setSelectMode = (new_mode: string) => {
        this.setState({ select_mode: new_mode });
    };

    /**
     * Set filter values
     * @param values values passed from FilterUI components
     */
    setFilters = (values: any) => {
        if (this.state.highlightMode) {
            this.setState({ filters: values });
        } else {
            values.g_searched = [];
            this.setState({ filters: values });
        }
    };

    /**
     * Store custom fields of selection view globally
     * @param values
     */
    setCustomFields = (values: any) => {
        this.setState({ customFields: values });
        if (!this.state.is_loading) {
            updateTaxaminerSettings(
                this.props.assembly_id,
                this.state.dataset_id,
                values,
                Array.from(this.state.selected_data)
            );
        }
    };

    /**
     * Set the currently highlighted genes
     * @param genes gene identifiers
     */
    setHighlightedGenes(genes: Set<string>): void {
        this.setState({ highlightedGenes: genes }, () => {
            this.setState({
                filters: {
                    e_value: this.state.filters.e_value,
                    show_unassinged: this.state.filters.show_unassinged,
                    g_searched: Array.from(genes),
                    c_searched: this.state.filters.c_searched,
                },
            });
        });
    }

    /**
     * Reset the global selection and save
     */
    resetSelection(): void {
        this.setState({ selected_data: new Set() });
    }

    /**
     * Chnage the highlight mode
     * @param mode true if on / false if off
     */
    async setHighlightMode(mode: boolean): Promise<any> {
        this.setState({ highlightMode: mode });
        if (!mode) {
            this.setState({
                filters: {
                    e_value: this.state.filters.e_value,
                    show_unassinged: this.state.filters.show_unassinged,
                    g_searched: [],
                    c_searched: this.state.filters.c_searched,
                },
            });
        } else {
            this.setState({
                filters: {
                    e_value: this.state.filters.e_value,
                    show_unassinged: this.state.filters.show_unassinged,
                    g_searched: Array.from(this.state.highlightedGenes),
                    c_searched: this.state.filters.c_searched,
                },
            });
        }
        return new Promise((resolve) => setTimeout(resolve, 100));
    }

    /**
     * Uses the scatter data from the main plot to slave the scatter matrix
     * @param values
     */
    shareScatterData = (values: any) => {
        this.setState({ scatter_data: values });
    };

    /**
     * Set "jumping to position in genome browser" behaviour
     * @param value
     */
    setGenomeBrowserInteraction(): void {
        const new_val = !this.state.genomeBrowserInteraction;
        this.setState({ genomeBrowserInteraction: new_val });
        this.props.setAutoScroll(new_val);
    }

    render() {
        return (
            <Container fluid>
                <Row>
                    <Col xs={7}>
                        <Scatter3D
                            is_loading={this.state.is_loading}
                            dataset_id={this.state.dataset_id}
                            assembly_id={this.props.assembly_id}
                            sendClick={this.handleDataClick}
                            sendCameraData={this.callbackFunction}
                            e_value={this.state.filters.e_value}
                            show_unassigned={this.state.filters.show_unassinged}
                            passScatterData={this.shareScatterData}
                            userID={this.state.userID}
                            token={this.state.token}
                            g_searched={this.state.filters.g_searched}
                            c_searched={this.state.filters.c_searched}
                            scatter_data={this.state.scatterPoints}
                            scatterPoints={this.state.scatterPoints}
                            gene_order_supported={
                                this.state.gene_order_supported
                            }
                            main_data={this.state.data}
                            selected_row={this.state.selected_row}
                            dim_string={this.state.dim_string}
                        />
                    </Col>
                    <Col>
                        <Tabs>
                            <Tab eventKey="Overview" title="Overview">
                                <Card className="m-2">
                                    <Card.Body>
                                        <Card.Title>Dataset</Card.Title>
                                        <Tabs>
                                            <Tab
                                                title="Load Dataset"
                                                eventKey="dataset-loader"
                                            >
                                                <DataSetSelector
                                                    dataset_changed={
                                                        this.setDataset
                                                    }
                                                    analyses={
                                                        this.props.analyses
                                                    }
                                                />
                                            </Tab>
                                            <Tab
                                                title="Metadata"
                                                eventKey="dataset-meta"
                                            >
                                                <DataSetMeta
                                                    assemblyID={
                                                        this.props.assembly_id
                                                    }
                                                    dataset_id={
                                                        this.state.dataset_id
                                                    }
                                                    userID={this.state.userID}
                                                    token={this.state.token}
                                                    metadata={
                                                        this.state.analysis
                                                    }
                                                />
                                            </Tab>
                                        </Tabs>
                                    </Card.Body>
                                </Card>
                                <SelectionView
                                    is_loading={this.state.is_loading}
                                    row={this.state.selected_row}
                                    aa_seq={this.state.aa_seq}
                                    fields={this.state.fields}
                                    assemblyID={this.props.assembly_id}
                                    analysisID={this.state.dataset_id}
                                    userID={this.state.userID}
                                    token={this.state.token}
                                    passCustomFields={this.setCustomFields}
                                    setAutoScroll={
                                        this.setGenomeBrowserInteraction
                                    }
                                    gene_pos_supported={
                                        this.state.gene_pos_supported
                                    }
                                />
                            </Tab>
                            <Tab eventKey="Filter" title="Filters">
                                <FilterUI
                                    g_options={this.state.g_options}
                                    sendValuesUp={this.setFilters}
                                    sendClick={this.handleDataClick}
                                    contig_options={this.state.contigs}
                                    global_selection={this.state.selected_data}
                                    highlightedGenes={
                                        this.state.highlightedGenes
                                    }
                                    passNewHighlightedGenes={
                                        this.setHighlightedGenes
                                    }
                                    highlightMode={this.state.highlightMode}
                                    setHighlightMode={this.setHighlightMode}
                                />
                            </Tab>
                            <Tab eventKey="diamond" title="Diamond Output">
                                <Row>
                                    <Col>
                                        <Table
                                            dataset_id={this.state.dataset_id}
                                            assembly_id={this.props.assembly_id}
                                            row={this.state.selected_row}
                                            userID={this.state.userID}
                                            token={this.state.token}
                                        />
                                    </Col>
                                </Row>
                            </Tab>
                            <Tab
                                eventKey="scatter_matrix"
                                title="Scatter Matrix"
                            >
                                <ScatterMatrix
                                    sendClick={this.handleDataClick}
                                    e_value={this.state.filters.e_value}
                                    show_unassigned={
                                        this.state.filters.show_unassinged
                                    }
                                    scatter_data={this.state.scatter_data}
                                    scatterPoints={this.state.scatterPoints}
                                    g_searched={this.state.filters.g_searched}
                                    c_searched={this.state.filters.c_searched}
                                    dim_string={this.state.dim_string}
                                />
                            </Tab>
                            <Tab eventKey="PCA" title="PCA">
                                <Row>
                                    <Col>
                                        <PCAPlot
                                            camera={this.state.camera}
                                            dataset_id={this.state.dataset_id}
                                            assemblyID={this.props.assembly_id}
                                            userID={this.state.userID}
                                            token={this.state.token}
                                            is_loading={this.state.is_loading}
                                        />
                                    </Col>
                                </Row>
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
                <TableView
                    data={this.state.data}
                    keys={this.state.selected_data}
                    setSelectMode={this.setSelectMode}
                    passClick={this.handleDataClick}
                    dataset_id={this.state.dataset_id}
                    userID={this.state.userID}
                    token={this.state.token}
                    assemblyID={this.props.assembly_id}
                    row={this.state.selected_row}
                    customFields={this.state.customFields}
                    resetSelection={this.resetSelection}
                />
                <br />
                <br />
            </Container>
        );
    }
}

export { TaxaminerDashboard };
