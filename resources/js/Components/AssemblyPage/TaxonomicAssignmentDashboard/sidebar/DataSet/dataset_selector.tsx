import React from "react";
import { Button, InputGroup } from "react-bootstrap";
import Form from 'react-bootstrap/Form';

interface Analysis {
    id: number
    name: string
    label: string | null
}

interface State {
    analyses: Analysis[]
    new_id: number
    show_import_modal: boolean
    show_remove: boolean
}

interface Props {
    dataset_changed: (id: number) => void
    analyses: Analysis[]
}

const default_analysis = [{id: -1, name: "Select a dataset to get started", label: ""}]

// Allows the user to select a dataset
class DataSetSelector extends React.Component<Props, State> {
    constructor(props: Props){
        super(props)
        this.state = {
            analyses: default_analysis,
            new_id: -1,
            show_import_modal: false,
            show_remove: false
        }
    }

    /**
     * Load Inital datasets
     */
    componentDidMount(): void {
        console.log(this.props.analyses);
        const extended = default_analysis.concat(this.props.analyses);
        for (const analysis of extended) {
            if (analysis.label && analysis.label !== "") {
                analysis.name = analysis.label
            }
        }
        this.setState({analyses: extended})
    }

    render() {
        return (
            <>
            <InputGroup className="m-2">
                <Form.Select
                    onChange={(e: any) => this.setState({new_id: parseInt(e.target.value)})}
                    defaultValue={undefined}>
                    {this.state.analyses && this.state.analyses.map((e: Analysis) => {
                        return <option key={e.id} value={e.id}>{e.name}</option>;
                    })}
                    </Form.Select>
                     <Button
                    type="submit"
                    onClick={() => this.props.dataset_changed(this.state.new_id)}
                    disabled={(this.state.new_id === -1)}
                    ><span className='bi bi-arrow-right-circle m-2'/>Load</Button>
            </InputGroup>
        </>
        );
    }
}

export { DataSetSelector }
