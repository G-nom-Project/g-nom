import React from "react";
import { Accordion } from "react-bootstrap";
import "./style.css";
import { fetchTaxaminerMetadata } from "../../api";


interface Props {
    dataset_id: number
    userID: number
    token: string
    assemblyID: number
    metadata: any
}

interface State {
    metadata: string
}


class DataSetMeta extends React.Component<Props, State> {
    constructor(props: Props){
		super(props);
		this.state ={
            metadata: "Loading..."
        }
	}

    /**
     * Format the metadata
     */
    convertMetadata(my_data: string): void {
        const data_string = my_data
        this.setState({metadata: data_string})
    }

    /**
     * Dataset ID changed
     * @param prevProps previous component props
     * @param prevState previous component state
     * @param snapshot previous snapshot
     */
    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.dataset_id !== this.props.dataset_id) {
            fetchTaxaminerMetadata(this.props.assemblyID, this.props.dataset_id)
            .then(data => {
                this.convertMetadata(data)
            })
        }
    }

    render() {
        return (
            <Accordion className="m-2">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Metadata</Accordion.Header>
                    <Accordion.Body>
                        <span className="text-secondary" style={{whiteSpace: "pre-wrap"}}>{JSON.stringify(this.state.metadata)}</span>
                     </Accordion.Body>
                 </Accordion.Item>
            </Accordion>
        );
    }
}

export { DataSetMeta }
