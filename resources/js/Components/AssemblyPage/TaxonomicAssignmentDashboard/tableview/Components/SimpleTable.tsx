import { Component } from 'react';
import { Button, Table } from 'react-bootstrap';
import {ColumnKey} from "@/Components/AssemblyPage/TaxonomicAssignmentDashboard/components/shared/RichTable";


interface Props {
    row_keys: string[]
    col_keys: ColumnKey[]
    master_data:  { [key: string]: any }
    passClick: any
    trackTable: (cols: any, rows: any) => void
}

interface State {
    table_data: any[]
    key: string
    loading: boolean
    custom_fields: any[]
    show_field_modal: boolean
    rows: { [key: string]: any }
    sortKey: string | null
    sortDir: 'asc' | 'desc'
    page: number
    pageSize: number
    search: { [key: string]: string }
}



class SimpleTable extends Component<Props, State> {
    constructor(props: any){
        super(props);
        this.state = {
            table_data: [],
            key: "",
            loading: false,
            custom_fields: [],
            show_field_modal: false,
            rows: [],
            sortKey: null,
            sortDir: 'asc',
            page: 1,
            pageSize: 10,
            search: {}
        };
    }

    handleSort = (key: string) => {
        this.setState(prev => ({
            sortKey: key,
            sortDir:
                prev.sortKey === key && prev.sortDir === 'asc'
                    ? 'desc'
                    : 'asc',
            page: 1
        }));
    };

    sortRows(rows: any[]) {
        const { sortKey, sortDir } = this.state;
        if (!sortKey) return rows;
        return [...rows].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];

            // Handle null / undefined
            if (av == null) return 1;
            if (bv == null) return -1;

            // Detect numeric
            const aNum = parseFloat(av);
            const bNum = parseFloat(bv);
            const isNumeric = !isNaN(aNum) && !isNaN(bNum);

            if (isNumeric) {
                return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Fallback: string comparison
            const aStr = String(av).toLowerCase();
            const bStr = String(bv).toLowerCase();

            if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    handlePageChange = (page: number) => {
        this.setState({ page });
    };

    paginateRows(rows: any[]) {
        const { page, pageSize } = this.state;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }

    handleSearchChange = (field: string, value: string) => {
        this.setState(prev => ({
            search: {
                ...prev.search,
                [field]: value
            },
            page: 1
        }));
    };

    filterRows(rows: any[]) {
        const { search } = this.state;

        return rows.filter(row =>
            Object.entries(search).every(([field, term]) => {
                if (!term) return true;
                const value = row[field];
                return value != null &&
                    String(value).toLowerCase().includes(term.toLowerCase());
            })
        );
    }


    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        return (
            nextProps.row_keys !== this.props.row_keys ||
            nextProps.col_keys !== this.props.col_keys ||
            nextState.sortKey !== this.state.sortKey ||
            nextState.sortDir !== this.state.sortDir ||
            nextState.page !== this.state.page ||
            nextState.search !== this.state.search
        );
    }



    componentDidUpdate(prevProps: Props) {
        if (prevProps.row_keys !== this.props.row_keys) {
            const rows = this.props.row_keys
                .map(k => this.props.master_data[k])
                .filter(Boolean);
            this.setState({rows: rows})
        }
    }


    render() {
        const baseRows = this.props.row_keys
            .map(k => this.props.master_data[k])
            .filter(Boolean);
        const filteredRows = this.filterRows(baseRows);
        const sortedRows = this.sortRows(filteredRows);
        const pagedRows = this.paginateRows(sortedRows);
        const totalPages = Math.ceil(filteredRows.length / this.state.pageSize);

        return (
            <>
                <div className="table-responsive mt-2">
                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>Select</th>
                            {this.props.col_keys.map(each => (

                                <th key={each.value}>
                                    <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => this.handleSort(each.value)}
                                    >
                                        {each.label}
                                        {this.state.sortKey === each.value && (this.state.sortDir === 'asc' ? ' ▲' : ' ▼')}
                                    </button>
                                    {(each.value === 'g_name' || each.value === 'plot_label' || each.value === 'best_hit') && (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm mt-1"
                                            placeholder="Search…"
                                            value={this.state.search[each.value] || ''}
                                            onChange={e =>
                                                this.handleSearchChange(each.value, e.target.value)
                                            }
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                        </thead>

                        <tbody>
                        {pagedRows && pagedRows.map((each, idx) => (
                            <tr key={idx}>
                                <td><Button size="sm" onClick={() => this.props.passClick([each['g_name']])}><i className="bi bi-search"></i></Button></td>
                                {this.props.col_keys.map(field => (
                                    <td key={field.value}>
                                        {each[field.value] ?? 'No data'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </Table>

                    {/* Pagination controls */}
                    <div className="d-flex justify-content-center gap-2">
                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={this.state.page === 1}
                            onClick={() => this.handlePageChange(this.state.page - 1)}
                        >
                            Prev
                        </button>

                        <span>
                        Page {this.state.page} of {totalPages}
                    </span>

                        <button
                            className="btn btn-sm btn-secondary"
                            disabled={this.state.page === totalPages}
                            onClick={() => this.handlePageChange(this.state.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </>
        );
    }
}

export default SimpleTable;
