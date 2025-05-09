import { Component } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import Card from 'react-bootstrap/Card';
import { Row, Col, Form } from 'react-bootstrap';

// possible options
import options from "./main_cols.json";
const animatedComponents = makeAnimated();

interface Props {
	passCols: (cols: any[]) => void
	options: any[]
	customFields: any[]
}

interface State {
	synced: boolean
	selection: any
}

class ColumnSelector extends Component<Props, State> {
	/**
	 * Init
	 * @param props Props passed
	 */
	constructor(props: any){
		super(props);
		this.state = {
			synced: false,
			selection: options
        }
	}

	/**
	 * Catch component updates
	 * @param prevProps previous Props
	 * @param prevState previous State
	 * @param snapshot previous snapshot
	 */
	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
		if (prevProps.customFields !== this.props.customFields) {
			if (this.state.synced) {
				const new_fields = Array.from(this.props.customFields)
				this.props.passCols(new_fields)
			}
		}
	}

	/**
	 * Toggle sync of table cols with custom fields
	 * @param e value of select
	 */
	setSync(e: boolean): void {
		this.setState({synced: e})

		// if sync is enabled, set the globally shared custom fields
		if (e) {
			this.props.passCols(this.props.customFields)
		// if sync is disabled, use the selection from the dropdown instead
		} else {
			this.props.passCols(this.state.selection)
		}
	}

	/**
	 * Update state and pass selection up
	 * @param selection event emitted by <Select>
	 */
	updateSelection(selection: any): void {
		this.props.passCols(selection)
		this.setState({selection: selection})
	}
	
	render() {
		return (
			<div>
			<Row className='mt-2'>
				<Col>
					<Card>
						<Card.Body>
							<Card.Title className='d-flex justify-content-between align-items-center'>Select Columns
							<Form.Check 
							type="switch"
							id="sync_custom_fields"
							label="Sync with custom fields"
							defaultChecked={false}
							onChange={(e) => this.setSync(e.target.checked)}
								/>
							</Card.Title>
							<Select 
							options={this.props.options} 
							components={animatedComponents} 
							isMulti defaultValue={options}
							// store selection changes in state
							onChange={(e: any) => this.updateSelection(e)}
							isClearable={false}
							// diable UI if table cols are synced to custom fields
							isDisabled={this.state.synced}
							/>
						</Card.Body>
					</Card>
				</Col>
		</Row>
		</div>
		)
	}
}

export default ColumnSelector