import { Component } from 'react';
import Plot from 'react-plotly.js';
import { Card, Form, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { fetchTaxaminerPCA } from '../../api';
import chroma from "chroma-js";

import variables from "../../static/tableRows.json"

interface Props {
	dataset_id: number
	assemblyID: number
	camera: any
	userID: number
	token: string
	is_loading: boolean
}

interface State {
	data: any[]
	traces: any[]
	selected_gene: string
	ui_revision: string
	selected_var: string
	selected_label: string
	selected_verbose: string
	arrows_on: boolean
	sync_camera: boolean
	camera: any
	figure: any
	data_revision : number
}


/**
 * Set a placeholder layout pointing the user to the dataset card -->
 */
const default_layout = {
	xaxis: {autorange: false, visible: false},
	yaxis: {autorange: false, visible: false},
	zaxis: {autorange: false, visible: false},
	annotations: [
		{
			text: "PCA Data will be rendered here once a dataset has been loaded",
			xref: "paper",
			yref: "paper",
			showarrow: false,
			font: {
				"size": 28
			}
		}
	]
}

/**
 * Main Scatterplot Component
 */
class PCAPlot extends Component<Props, State> {
	constructor(props: Props){
		super(props);
		this.state ={
			data: [] , // raw JSON data
			traces: [], // traces dicts for plotly
			selected_gene: "", // g_name
			ui_revision: "true", // bound to plot to preserve camera position
			selected_var: "None",
			selected_label: "None",
			selected_verbose: "Click a point in the plot to get started",
			arrows_on: true,
			sync_camera: true,
			camera: this.props.camera,
			figure: {data: [], layout: default_layout, frames: [], config: {}, scene: {}},
			data_revision: 0
		}
	}

	/**
	 * Reload plot if dataset changed
	 * @param prevProps previous Props
	 * @param prevState previous State
	 * @param snapshot snapshot
	 */
	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
		if (prevProps.dataset_id !== this.props.dataset_id) {
			fetchTaxaminerPCA(this.props.assemblyID, this.props.dataset_id, this.props.userID, this.props.token)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			.then(data => this.setState({ data: data }), () => {
				this.build_plot()
			})
		}

		if (prevState.data !== this.state.data) {
			this.build_plot()
		}

		if (prevProps.camera !== this.props.camera && this.state.sync_camera) {
			this.setState({camera: this.props.camera}, () => {
				this.build_plot();
			})
		}

		if (prevState.arrows_on !== this.state.arrows_on) {
			this.build_plot();
		}
	}

	/**
	 * This fixes a problem where some interactions reset the camera.
	 * Manually updating the uirevision state blocks plot resets
	 * @returns True (as required by OnLegendClick() => )
	 */
	lock_uirevision(): boolean{
		this.setState({ ui_revision: "true" })
		return(true)
	}


	setVar(var_id: string){
		for (const variable of variables) {
			const re = new RegExp(variable.value + ".*");
			if (variable.value == var_id || re.test(var_id)) {
				return this.setState({selected_var: var_id, selected_label: variable.label, selected_verbose: variable.tooltip as string})
			}
		}

	}

	/**
	 * Convert API data into plotly traces
	 * @param data API data
	 * @returns list of traces
	 */
	transformData (data: any[]) {

		// Avoid NoneType Exceptions
		if (data == null) {
			return []
		}

		// holds all plot traces
		const traces: any[] = [];
		const my_scale = chroma.scale('Spectral');

		if (data.length !== 0) {
			for (let i = 0; i < data.length; i ++) {
				const pca_point = data[i]
				const pca_x : any[] = [];
				const pca_y : any[] = [];
				const pca_z : any[] = [];
				const pca_labels: string[] = []
				const real_pca_x: any[] = []
				const real_pca_y: any[] = []
				const real_pca_z: any[] = []
				// vector origin
				pca_x.push(0)
				pca_y.push(0)
				pca_z.push(0)
				pca_labels.push("origin")

				// vector tip
				pca_x.push(pca_point['x'][0])
				pca_y.push(pca_point['y'][0])
				pca_z.push(pca_point['z'][0])
				pca_labels.push(pca_point['label'])
				real_pca_x.push(pca_point['x'][0])
				real_pca_y.push(pca_point['y'][0])
				real_pca_z.push(pca_point['z'][0])

				// insert empty value to skip line to next origin
				pca_x.push(undefined)
				pca_y.push(undefined)
				pca_z.push(undefined)
				pca_labels.push("skip")


				// create plotly trace
				const pca_trace: any = {
					legendgroup: pca_point.label,
					type: 'scatter3d',
					mode: 'lines',
					width: 5,
					x: pca_x,
					y: pca_y,
					z: pca_z,
					name: pca_point.label,
					text: pca_labels,
					marker: {
						color: my_scale(i/data.length).saturate(6).hex()
					},
					customdata: [pca_point.label]
				}

				// scale cones based on max val
				const cone_x = real_pca_x.map(each => {
					return parseFloat(each) * 0.5
				})
				const cone_y = real_pca_y.map(each => {
					return parseFloat(each) * 0.5
				})
				const cone_z = real_pca_z.map(each => {
					return parseFloat(each) * 0.5
				})

				// add cones to the tips of the PCA trace to form arrows
				const pca_cones = {
					legendgroup: pca_point.label,
					type: "cone",
					// shorten the cones such that the mouse hover hits the PCA trace
					x: real_pca_x.map(each => {return parseFloat(each) - parseFloat(each) * 0.01}),
					y: real_pca_y.map(each => {return parseFloat(each) - parseFloat(each) * 0.01}),
					z: real_pca_z.map(each => {return parseFloat(each) - parseFloat(each) * 0.01}),
					u: cone_x,
					v: cone_y,
					w: cone_z,
					anchor: "tip",
					// disable hoverdata and snapping
					hoverinfo: "skip",
					name: "PCA weights",
					// all black color gradient
					colorscale: [[0, my_scale(i/data.length).saturate(6).hex()], [1, my_scale(i/data.length).saturate(6).hex()]],
					showscale: false,
					sizemode: "absolute",
					// scale size based on shortest vector
					sizeref: 0.07,
					//sizeref: 0.05,
					customdata: [pca_point.label]
				}
				traces.push(pca_trace)
				if (this.state.arrows_on) {
					traces.push(pca_cones)
				}
			}
		}
		return traces
	}

	/**
	 * Build the 3D scatterplot
	 * @returns Plotly Plot as React component
	 */
	build_plot() {
		const new_data = this.transformData(this.state.data)
		const camera = this.props.camera

		let new_layout = {};
		if (camera === null) {
			new_layout = {
				autosize: true,
				showlegend: true,
				legend: {itemsizing: 'constant', tracegroupgap: 1, itemclick: false, itemdoubleclick: false},
			}
		} else {
			new_layout = {
				autosize: true,
				showlegend: true,
				uirevision: this.state.ui_revision,
				datarevision: this.state.data_revision,
				scene: {camera: this.props.camera},
				legend: {itemsizing: 'constant', tracegroupgap: 1, itemclick: false, itemdoubleclick: false},
			}
		}

		const new_config = {scrollZoom: true}

		this.setState({figure: {data: new_data, layout: new_layout, config: new_config}})
	}

	toggleArrows = () => {
		this.setState({arrows_on: !this.state.arrows_on})
	}

	toggleSync = () => {
		this.setState({sync_camera: !this.state.sync_camera})
	}

	updateCamera = (camera: any) => {
		this.setState({camera: camera})
	}

	/**
	 * Render react component
	 * @returns render react component
	 */
	render() {
		return (
			<Row>
				<Col xs={8}>

						<Plot
							data={this.state.figure.data}
							layout={this.state.figure.layout}
							config={this.state.figure.config}
							useResizeHandler = {true}
							style = {{width: "100%",  minHeight: 600}}
							// onLegendClick={(e: any) => this.lock_uirevision()}
							// @ts-ignore
							className='m-2'
							onClick={(e: any) => this.setVar(e.points[0].data.customdata[0])}
						/>

				</Col>
				<Col xs={4}>
					<Card className='mt-2'>
						<Card.Header>Variable Info</Card.Header>
						<Card.Body>
							<Card.Title>Selected: {this.state.selected_var}</Card.Title>
							<Card.Subtitle className="mb-2 text-muted">{this.state.selected_label}</Card.Subtitle>
							<Card.Text>{this.state.selected_verbose}</Card.Text>
						</Card.Body>
					</Card>
					<Card className='mt-2'>
						<Card.Header>
							Plot settings
						</Card.Header>
						<Card.Body>
						<Form>
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="Sync perspective to scatterplot"
								checked={this.state.sync_camera}
								onChange={() => this.toggleSync()}
                            />
							<Form.Check
                                type="switch"
                                id="hoverdata-switch"
                                label="Arrow tips"
								checked={this.state.arrows_on}
								onChange={() => this.toggleArrows()}
                            />
                        </Form>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		)
	}
}

export default PCAPlot;
