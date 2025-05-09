import React from "react";
import { Col, OverlayTrigger, Tooltip } from "react-bootstrap";
import { InputGroup } from "react-bootstrap";
import Form from 'react-bootstrap/Form'

class CustomOutput extends React.Component<any, any> {
    constructor(props: any){
		super(props);
		this.state ={ }
	}

    render() {
        return (
            <>
            <Col md="auto" xs={6}>
                {this.props.tooltip != undefined && (
                    <OverlayTrigger
                    overlay={
                        <Tooltip>
                            {this.props.tooltip}
                        </Tooltip>
                    }>
                    <InputGroup className="m-2">
                        <InputGroup.Text id={this.props.id}>{this.props.name}</InputGroup.Text>
                        <Form.Control
                        placeholder="Selected a Gene to get started"
                        contentEditable={false}
                        value={this.props.row[this.props.col]}
                        />
                    </InputGroup>
                    </OverlayTrigger>
                )}
                {this.props.tooltip === undefined && (
                    <InputGroup className="m-2">
                        <InputGroup.Text id={this.props.id}>{this.props.name}</InputGroup.Text>
                        <Form.Control
                        placeholder="Selected a Gene to get started"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                        contentEditable={false}
                        value={this.props.row[this.props.col]}
                        />
                    </InputGroup>
                )}
            </Col>
            </>
        );
    } 
}

export default CustomOutput