import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';

import { Modal } from 'react-bootstrap';
import React, { Component } from 'react';
import { Row, Col } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import { Spinner } from "react-bootstrap";

// local imports
import "./customstyle.css"
import ColumnSelector from "./ColumnSelector";
import { fetchTaxaminerDiamond } from "../../api";

interface Props {
    dataset_id: number
    assembly_id: number
    row: any
    userID: number
    token: string
}

interface State {
    table_data: any[]
    key: string
    loading: boolean
    custom_fields: any[]
    show_field_modal: boolean
    active_cols: any[]
    is_valid: boolean
}

class Table extends Component<Props, State> {
    constructor(props: Props){
		super(props);
		this.state ={
            table_data: [],
            key: "",
            loading: false,
            custom_fields: [],
            show_field_modal: false,
            active_cols: [
                {
                    dataField: "sseqid",
                    text: "ID",
                    sort: true,
                    filter: textFilter()
                }
            ],
            is_valid: true
        }
	}

    /**
    * Toogle modal open
    */
    showModal = (): void => {
        this.setState({ show_field_modal: true });
    };

    /**
    * Toggle modal closed
    */
    hideModal = (): void => {
        this.setState({ show_field_modal: false });
    };

    /**
    * Selection passed upwards
    * @param fields JSON
    */
    handleFieldsChange = (fields: any) => {
        const new_cols = []
        // avoid tables with zero columns
        if (fields.length === 0) {
            this.setState({is_valid: false})
        } else {
            for (const field of fields) {
                for (const col of this.columns) {
                    if (col.dataField === field.value) {
                        new_cols.push(col)
                    }
                }
            }
            this.setState({ custom_fields: fields})
            this.setState({active_cols: new_cols})

            // set valid flag if necessary
            if (!this.state.is_valid) {
                this.setState({is_valid: true})
            }
        }
    }


    // Props of parent element changed (=> selected row)
    componentDidUpdate(prev_props: any): void {
        if (prev_props.row !== this.props.row) {
            this.setState({loading: true})
            // fetch the table data
            let fasta_col = "fasta_header"
            if (Object.prototype.hasOwnProperty.call(this.props.row, "protID")) {
                fasta_col = "protID"
            }
            fetchTaxaminerDiamond(this.props.assembly_id, this.props.dataset_id, this.props.row[fasta_col])
            .then((data: any) => {
                this.setState({table_data : data})
                this.setState({loading: false})
            });
        }
    }



    // These are preset values
    // TODO: make user selectable
    columns = [
        {
            dataField: "sseqid",
            text: "ID",
            sort: true,
            filter: textFilter()
        },
        {
            dataField: "taxname",
            text: "scientific name",
            sort: true,
            filter: textFilter()
        },
        {
            dataField: "evalue",
            text: "e-value",
            sort: true
        },
        {
            dataField: "pident",
            text: "%-identity",
            sort: true
        },
        {
            dataField: "mismatch",
            text: "mismatches",
            sort: true
        },
    ]

  render() {
    return (
        <>
            <Row>
                <Col className="text-center">
                    <Button className="md-2" style={{width: "100%"}} onClick={() => this.showModal()}>
                        <span className='bi bi-list-ul m-2'/>Change columns
                    </Button>
                </Col>
                <Modal show={this.state.show_field_modal} handleClose={this.hideModal}>
                    <Modal.Header>
                        <Modal.Title>Choose custom fields</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ColumnSelector
                        set_fields={this.handleFieldsChange}
                        default_fields={this.state.custom_fields}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.hideModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </Row>
            <Row>
                <div style={{ overflow: "auto" }}>
                {this.state.loading  && <div className="text-center"><br></br><Spinner animation="border"></Spinner></div>}
                <br></br>
                <BootstrapTable
                keyField="id"
                data={this.state.table_data}
                columns={this.columns}
                pagination={ paginationFactory({}) }
                filter={ filterFactory() }
                />
                </div>
            </Row>
        </>
      );
  }
}

export default Table;
