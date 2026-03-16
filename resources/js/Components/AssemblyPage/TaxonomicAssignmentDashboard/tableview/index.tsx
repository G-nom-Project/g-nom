import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/esm/Container';

// Stylesheet
import 'bootstrap/dist/css/bootstrap.min.css';
import SelectionModeSelector from './Components/SelectionModeSelector';
import ColumnSelector from './Components/ColumnSelector'

import fields_glossary from"@/Components/AssemblyPage/TaxonomicAssignmentDashboard/static/tableRows.json";
import SimpleTable from './Components/SimpleTable';

interface Props {
    data: []
    keys: Set<string>
    setSelectMode: any
    passClick: (genes: string[]) => void
    dataset_id: number
    base_url: string
    row: Record<never, never>
    customFields: any[]
    resetSelection: () => void
}

interface State {
    aa_seq: string
    camera: any
    select_mode: string
    selected_data: Set<string>
    data: any
    col_keys: any[]
    options: any[]
    child_cols: any[]
    child_data: any
}


class TableView extends React.Component<Props, State> {
    // Set up states for loading data
    constructor(props: Props){
        super(props);
        this.state ={
            aa_seq: "Pick a gene",
            camera: null,
            select_mode: 'neutral',
            selected_data: new Set(),
            data: undefined,
            col_keys: [{ label: "ID", value: "g_name"}, { label: "Contig ID", value: "c_name"}, { label: "Plot label", value: "plot_label" }, { label: "e-value", value: "bh_evalue" }],
            options: [{ label: "ID", value: "g_name"}, { label: "Contig ID", value: "c_name"}, { label: "Plot label", value: "plot_label" }, { label: "e-value", value: "bh_evalue" }],
            child_cols: [],
            child_data: []
        }
        this.csvExport = this.csvExport.bind(this);
        this.trackTable = this.trackTable.bind(this);
    }

    /**
     * Component did update
     * @param prevProps previous Props
     */
    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.row !== this.props.row) {
            this.convertFieldsOptions()
        }
    }

    /**
     * Update table columns
     * @param cols array of col names (keys)
     */
    setTableCols = (cols: any[]) => {
        for (const col of cols) {
            if (col.value === "g_name") {
                return this.setState({col_keys: cols})
            }
        }
        // always preserve g_name as it is the main identifier
        cols.unshift({ label: "ID", value: "g_name"})
        return this.setState({col_keys: cols})
    }

    /**
     * Convert available fields into table colmunns
     */
    convertFieldsOptions() {
        let options: { label: string; value: string; }[] = []
        // available row features
        const row_keys = Object.keys(this.props.row)
        options = row_keys.map((each: string) => {
            // match against glossary
            for (const field of fields_glossary) {
                // exact match
                if (each === field.value) {
                    return { label: (field.label), value: each, tooltip: field.tooltip + " [" + each + "]" }
                } else {
                    // match with suffix (c_cov_...)
                    // anchor "^" makes sure to match from beginning; '_' to avoid lcaID matching to lca etc.
                    const re = new RegExp("^" + field.value + "_.*");
                    if (re.test(each)) {
                        return { label: (field.label) + " " + each.split('_').slice(-1)[0], value: each, tooltip: field.tooltip + " [" + each + "]" }
                    }
                }
            }
            return { label: each, value: each }
        })
        this.setState({options: options})
    }

    /**
     * Export to .csv file
     */
    csvExport() {
        const fields = this.state.child_cols.map((col: any) => {
            return col.dataField
        })
        const names = this.state.child_cols.map((col: any) => {
            return col.text
        })
        let file_content = ""

        // Table header row
        for (const name of names) {
            file_content = file_content.concat(name + ",")
        }
        file_content = file_content.concat("\n")

        // print rows
        for (const row of this.state.child_data) {
            for (const field of fields) {
                file_content = file_content.concat(row[field] + ",")
            }
            file_content = file_content.concat("\n")
        }

        const a = document.createElement("a");
        // create file
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file_content));
        // set as download
        a.setAttribute('download', "selection.csv");
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // clean up
        document.body.removeChild(a);
    }

    /**
     * Track tabl edits
     * @param cols table columns
     * @param data table data
     */
    trackTable(cols: any, data: any) {
        this.setState({child_cols: cols, child_data: data})
    }

    render() {
        return (
            <Container fluid>
                <Row>
                    <Col xs={7}>
                        <SimpleTable
                            master_data={this.props.data}
                            passClick={this.props.passClick}
                            row_keys = {Array.from(this.props.keys)}
                            col_keys={this.state.col_keys  || []}
                            trackTable = {this.trackTable}
                        />
                    </Col>
                    <Col>
                        <Row>

                        </Row>
                        <Row>
                            <SelectionModeSelector
                                passMode = {this.props.setSelectMode}
                                selection = {this.props.keys}
                                dataset_id = {this.props.dataset_id}
                                base_url = {this.props.base_url}
                                main_data = {this.props.data}
                                resetSelection = {this.props.resetSelection}
                                passCsvExport = {this.csvExport}
                            />
                        </Row>
                        <Row>
                            <ColumnSelector
                                passCols = {this.setTableCols}
                                options={this.state.options}
                                customFields={this.props.customFields}
                            />
                        </Row>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export { TableView }
