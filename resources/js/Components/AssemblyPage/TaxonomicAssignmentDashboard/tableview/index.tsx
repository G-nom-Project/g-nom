import React, { createContext } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/esm/Container';

// Stylesheet
import 'bootstrap/dist/css/bootstrap.min.css';
import SelectionModeSelector from './Components/SelectionModeSelector';
import SelectionTable from './Components/SelectionTable';
import ColumnSelector from './Components/ColumnSelector'
import { fetchTaxaminerMain } from '../../../api';

import fields_glossary from "./Components/field_options.json"


interface Props {
    data: []
    keys: Set<string>
    setSelectMode: any
    passClick: any
    dataset_id: number
    userID: number
    token: string
    assemblyID: number
    row: any
    customFields: any[]
    resetSelection: Function
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
	constructor(props: any){
		super(props);
		this.state ={ 
            // selected_row: {g_name: "Pick a gene", taxonomic_assignment: "Pick a gene", plot_label: "Pick a gene", best_hit: "Pick a gene", c_name: "Pick a gene", bh_evalue: 0, best_hitID: "None"}, 
            aa_seq: "Pick a gene",
            camera: null,
            select_mode: 'neutral',
            selected_data: new Set(),
            data: undefined,
            col_keys: [{ label: "ID", value: "g_name"}, { label: "Plot label", value: "plot_label" }, { label: "e-value", value: "bh_evalue" }],
            options: [{ label: "ID", value: "g_name"}, { label: "Plot label", value: "plot_label" }, { label: "e-value", value: "bh_evalue" }],
            child_cols: [],
            child_data: []
        }
        // bin to local context
        this.csvExport = this.csvExport.bind(this);
        this.trackTable = this.trackTable.bind(this);
	}

    /**
     * Component did update
     * @param prevProps previous Props
     * @param prevState previous State
     * @param snapshot previous snapshot
     */
     componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
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
            if (col.value == "g_name") {
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
                    return { label: (field.label), value: each }
                } else {
                    // match with suffix (c_cov_...)
                    const re = new RegExp(field.value + ".*");
                    if (re.test(each)) {
                        return { label: (field.label + " (" + each + ")"), value: each }
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
     * Track table edits
     * @param cols table columns
     * @param data table data
     */
    trackTable(cols: any, data: any): void {
        this.setState({child_cols: cols, child_data: data})
    }

    render() {
        return (
            <Container fluid>
                <Row>
                    <Col xs={7}>
                        <SelectionTable
                        master_data={this.props.data}
                        keys={this.props.keys}
                        // pass table click events up
                        passClick={this.props.passClick}
                        col_keys = {this.state.col_keys}
                        trackTable = {this.trackTable}
                        />
                    </Col>
                    <Col>
                        <Row>
                            
                        </Row>
                        <Row>
                            <SelectionModeSelector
                            passMode={this.props.setSelectMode}
                            selection={this.props.keys}
                            analysisID={this.props.dataset_id}
                            assemblyID={this.props.assemblyID}
                            userID={this.props.userID}
                            resetSelection = {this.props.resetSelection}
                            token={this.props.token}
                            main_data = {this.props.data}
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