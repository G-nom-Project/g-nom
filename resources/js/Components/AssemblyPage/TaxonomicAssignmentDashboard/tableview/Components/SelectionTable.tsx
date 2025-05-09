/* eslint-disable @typescript-eslint/ban-ts-comment */
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
// eslint-disable @typescript-eslint/ban-ts-comment
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';

// local imports
import "./customstyle.css"


/**
 * Custom number sorting function for bootstrap-table
 * @param a first value
 * @param b second value
 * @param order asc or desc
 * @param dataField dataField ID (unused)
 * @param rowA first row
 * @param rowB second row
 * @returns sort indices for bootstrap-table
 */
 const numberSort = (a: number, b: number, order: string, dataField: any, rowA: any, rowB: any) => {
    if (order === 'asc') {
      return Number(b) - Number(a);
    }
    return Number(a) - Number(b); // desc
}

interface Props {
    col_keys: string[]
    keys: Set<string>
    master_data:  { [key: string]: any }
    passClick: any
    trackTable: Function
}

interface State {
    table_data: any[]
    key: string
    loading: boolean
    custom_fields: any[]
    show_field_modal: boolean
    cols: any[]
}

const rich_cols = {
    g_name:  {dataField: "g_name", text: "ID", sort: true, filter: textFilter()},
    plot_label: {dataField: "plot_label", text: "Plot Label", sort: true, filter: textFilter()},
    bh_evalue: { dataField: "bh_evalue", text: "Best hit e-value", sort: true, sortFunc: numberSort}
}

class SelectionTable extends Component<Props, State> {
    constructor(props: any){
		super(props);
		this.state ={ table_data: [], key: "", loading: false, custom_fields: [], show_field_modal: false, cols: Object.values(rich_cols)}
	}

    /**
    * Selection passed upwards
    * @param fields JSON
    */
    handleFieldsChange = (fields: any): any => {
        this.setState({ custom_fields: fields})
    }

    /**
     * Add custom cols on component mount
     */
    componentDidMount() {
        // also update table cols
        const new_cols: string[] = []
        this.props.col_keys.forEach((element: any) => {
            new_cols.push((rich_cols as any)[element['value']])
        });
        this.setState({cols: new_cols})
    }

   /**
     * Props of parent element changed (=> selected row)
     * @param prev_props previous selection
     */
    componentDidUpdate(prevProps: Props, prevState: State, snapshot: any) {
    const new_rows = []
    const text_cols = ["c_name", "fasta_header", "corrected_lca", "best_hit"]


    // Table data has changed
    if (this.state.table_data.length !== this.props.keys.size) {
        const my_keys = Array.from(this.props.keys)
        for (const key of my_keys) {
            if (this.props.master_data[key]) {
                new_rows.push(this.props.master_data[key])
            } else {
                //console.warn(`Master data missing for ${key}`)
            }
        }
        this.setState({table_data: new_rows});
        this.props.trackTable(this.state.cols, new_rows)
    }

    // Table cols have changed
    if (prevProps.col_keys !== this.props.col_keys) {
        // also update table cols
        const new_cols: any[] = []
        this.props.col_keys.forEach((element: any) => {
            if (Object.prototype.hasOwnProperty.call(rich_cols, element['value'])) {
                new_cols.push((rich_cols as any)[element['value']])
            } else {
                const constructed_col = {
                    dataField: element.value,
                    text: element.label,
                    sort: true,
                    filter: undefined,
                    sortFunc: undefined,
                    isFixed: false
                }
                // either allow sorting by value or searching by string
                if (text_cols.includes(element.value)) {
                    // @ts-ignore
                   constructed_col.filter = textFilter()
                } else {
                    // @ts-ignore
                    constructed_col.sortFunc = numberSort
                }
                new_cols.push(constructed_col)
            }
        });
        this.setState({cols: new_cols});
        this.props.trackTable(new_cols, this.state.table_data)
    }
}

    // Table events
    rowEvents = {
        /**
         * This is a premade wrapper functionn
         * @param e Click event
         * @param row raw row data (JSON)
         * @param rowIndex row Index
         */
        onClick: (e: any, row: any, rowIndex:any) => {
            this.props.passClick([row.g_name])
        }
      };
    

  render() {
    return (
        <>
            <Row className='mt-2'>
                <div style={{ overflow: "auto" }}>
                <BootstrapTable
                keyField="id" 
                data={this.state.table_data} 
                columns={this.state.cols}
                rowEvents={this.rowEvents}
                pagination={ paginationFactory({}) }
                filter={ filterFactory() }
                />
                </div>
            </Row>
        </>
      );
  }
}

export default SelectionTable;
