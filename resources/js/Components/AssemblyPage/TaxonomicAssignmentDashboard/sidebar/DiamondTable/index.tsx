import { Component } from 'react';
import "./customstyle.css"
import RichTable from '@/Components/AssemblyPage/TaxonomicAssignmentDashboard/components/shared/RichTable';
import ColumnSelector from './ColumnSelector';
import options from './diamond_cols.json'
import { fetchDiamond } from '@/Components/AssemblyPage/TaxonomicAssignmentDashboard/api';

export interface ColumnKey {
    label: string
    value: string
}

interface Props {
    dataset_id: number;
    row: any;
    base_url: string;
    assembly_id: number;
    taxonID: number;
}

interface State {
    table_data: any[]
    key: string
    loading: boolean
    col_keys: any[]
}


/**
 * Diamond table
 */
class Table extends Component<Props, State> {
    constructor(props: Props){
        super(props);
        this.state ={
            table_data: [],
            key: "",
            loading: false,
            col_keys: [{ "label": "Seq ID", "value": "sseqid" },{ "label": "e-value", "value": "evalue"}],
        }
    }


    // Props of parent element changed (=> selected row)
    componentDidUpdate(prevProps: Props) {
        let sequence_header = this.props.row.diamond_header
        if (prevProps.row !== this.props.row) {
            this.setState({loading: true})
            // if no diamond header is available, use fasta header and split at first whitespace
            if (this.props.row.diamond_header == undefined) {
                sequence_header = this.props.row.fasta_header.split(" ")[0]
            }
            // fetch the table data
            fetchDiamond(this.props.assembly_id, this.props.dataset_id, this.props.taxonID, sequence_header).then((data) => {
                // convert to appropriate datatype for proper sorting
                data = data.map((row: any) => {
                    row.evalue = Number(row.evalue);
                    return row;
                });
                this.setState({ table_data: data, loading: false });
            });
        }
    }


    setTableCols = (cols: ColumnKey[]) => {
        this.setState({col_keys: cols})
    }

    render() {
        return (
            <div className='mt-2'>
                <ColumnSelector
                    passCols = {this.setTableCols}
                    options={options}

                />
                <RichTable
                    master_data={this.state.table_data}
                    passClick={null}
                    row_keys={this.state.table_data.map((each) => {return each.qseqid})}
                    col_keys={this.state.col_keys  || []}
                />
            </div>
        );
    }
}

export default Table;
