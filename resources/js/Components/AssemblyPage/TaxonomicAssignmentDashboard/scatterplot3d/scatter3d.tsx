import { Component } from 'react';
import Plot from 'react-plotly.js';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { Button, ButtonGroup, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import chroma from 'chroma-js';
import FadeIn from 'react-fade-in/lib/FadeIn';


interface Props {
	is_loading: boolean

	assembly_id: number
	dataset_id: number
	sendClick: any
	sendCameraData: any
	passScatterData: any
	e_value: number
	show_unassigned: boolean
	userID: number
	token: string
	g_searched: string[]
	c_searched: string[]
	scatter_data: any
	scatterPoints: any[]

	selected_row: any
	main_data: any

	// backward compatibility
	gene_order_supported: boolean
	dim_string: string
}

interface State {
	data: any
	traces: any[]
	selected_gene: string
	aa_seq: string
	ui_revision: any
	auto_size: boolean
	auto_size_px: number
	marker_size: number
	manual_size: number
	color_palette: string
	color_dict: color_dict
	camera_ratios: {xy: number, xz: number, yz: number}
	legendonly: any[]
	last_click: string
	figure: any
	is_loading: boolean
	show_hover: boolean
	revision: number
	g_search_len: number
	last_click_time: any
	hover_buttons: string[]
	hoverTemplate: string
	starsign_steps: number
	opacity: number
	trace_order: string[]
	camera: any
	gene_plot_data: any[]
	frozen_starsign_gene: string
}


interface color_dict {
	[key: string]: string | undefined
}



/**
 * For the x-th item out of n items, generate the appropriate color on a chosen color scale
 * @param item_pos x
 * @param max_item_number n
 * @param color_descriptor One of "spectrum" or "colorblind"
 * @returns Hex-encoded color code
 */
const custom_color_generator = (item_pos: number, max_item_number: number, color_descriptor: string) => {
	if (color_descriptor == "spectrum") {
		const my_scale = chroma.scale('Spectral');
		if (item_pos % 2 === 0) {
			return my_scale(item_pos/max_item_number).saturate(3).hex()
		} else {
			return my_scale(1 -item_pos/max_item_number).saturate(3).hex()
		}
		
	} else if(color_descriptor == "colorblind") {
		// Map to a flat color scale
		// Color are defined by https://colorbrewer2.org , the chose scale is coloblind-friendly
		let my_scale = chroma.brewer.RdYlBu
		// Organically sourced randome numbers (TM)
		const pseudo_random = [0,9,5,3,6,2,10,7,4,1,8]
		return my_scale[pseudo_random[item_pos % 11]]
	}
}

const palettes = [{"label": "Spectrum", "value": "spectrum"}, {"label": "Colorblind", "value": "colorblind"}]


/**
 * Set a placeholder layout pointing the user to the dataset card -->
 */
const default_layout = {
	xaxis: {autorange: false, visible: false}, 
	yaxis: {autorange: false, visible: false}, 
	zaxis: {autorange: false, visible: false},
	annotations: [
		{
			text: "Start by selecting and loading a dataset →",
			xref: "paper",
			yref: "paper",
			showarrow: false,
			font: {
				"size": 28
			}
		}
	],
}


const frames: any[] = []

/**
 * Main Scatterplot Component
 */
class Scatter3D extends Component<Props, State> {
	constructor(props: Props){
		super(props);
		this.state ={ 
			data: [] , // raw JSON data
			traces: [], // traces dicts for plotly
			selected_gene: "", // g_name
			aa_seq: "", // inherited
			ui_revision: "true", // bound to plot to preserve camera position
			auto_size: true, // automatically size dots in scatterplot
			auto_size_px: 0,
			marker_size: 0, // actual dot size in the plot
			manual_size: 5, // dot size selected by user
			color_palette: "colorblind", // currently selected color palette
			color_dict: {},
			camera_ratios: {xy: 1.0, xz: 1.0, yz: 1.0},
			legendonly: [],
			last_click : "",
			figure: {data: [], layout: default_layout, frames: [], config: {}, scene: {}},
			is_loading: false,
			show_hover: true,
			revision: 1,
			g_search_len: 0,
			last_click_time: Date.now(), 
			hover_buttons: ["primary", "secondary", "secondary"],
			hoverTemplate: "%{customdata[0]} <br>%{customdata[1]} <br><extra>Best hit: %{customdata[2]} <br>Best hit e-value: %{customdata[3]} <br>Taxonomic assignment: %{customdata[4]} <br>Contig name: %{customdata[5]} <br> </extra>",
			starsign_steps: 0,
			opacity: 1,
			trace_order: [],
			camera: {},
			gene_plot_data: [],
			frozen_starsign_gene: ""
		}
        this.sendClick = this.sendClick.bind(this);


		// calculate frames
		const angle_step = 2 * Math.PI / 200;
		const center = {x:0, y:0}
		for (let i = 0, angle = 0; i < 200; i++, angle += angle_step) {
			const point = {
				x: center.x + Math.sin(angle) * 1,
				y: center.y + Math.cos(angle) * 1,
				z: 1
			}
			frames.push({layout: {"scene.camera.eye" : point}})
		}
	}

	/**
	 * Reload plot if dataset has changed
	 * @param prev previous state
	 */
	componentDidUpdate(prevProps: Props, prevState: State) {
		// Dataset has changed
		if (prevProps.scatterPoints !== this.props.scatterPoints || prevProps.dim_string !== this.props.dim_string) {
			const new_size = this.set_auto_size(this.props.scatterPoints);
			this.setState( { marker_size: new_size, auto_size: true, starsign_steps: 0, legendonly: [], figure: {}}, () => {
				return this.build_plot()
			})
		}
		// Filters have changed
		else if (prevProps.e_value !== this.props.e_value || prevProps.show_unassigned !== this.props.show_unassigned || this.state.g_search_len !== this.props.g_searched.length || prevProps.c_searched !== this.props.c_searched)
		{
			return this.build_plot(undefined, undefined, true)
		}
		// gene order and gene selection
		else if (prevProps.selected_row !== this.props.selected_row || prevState.starsign_steps !== this.state.starsign_steps || prevState.opacity !== this.state.opacity)
		{
			return this.build_plot()
		}
	}

	/**
	 * Regulate component updates => plot updates
	 * @param nextProps new Props
	 * @param nextState new state
	 * @param nextContext new context
	 * @returns boolean
	 */
	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
		// New dataset
		if (nextProps.scatterPoints !== this.props.scatterPoints || nextProps.dataset_id !== this.props.dataset_id || nextProps.dim_string !== this.props.dim_string) {
			return true
		}
		// external changes
		if (nextProps.e_value !== this.props.e_value || nextProps.show_unassigned !== this.props.show_unassigned || nextProps.c_searched !== this.props.c_searched) {
			return true
		}
		// figure config changes => sync to scatter matrix as well
		if(nextState.color_dict !== this.state.color_dict ||nextState.opacity !== this.state.opacity || nextState.marker_size !== this.state.marker_size || nextState.legendonly !== this.state.legendonly) {
			console.log(nextState.color_dict)
			this.props.passScatterData({ colors: nextState.color_dict, legendonly: nextState.legendonly, opacity: nextState.opacity, marker_size: nextState.marker_size})
			return true
		}
		// changes of the figure should always raise an update, otherwise user interaction is limited
		if (nextState.figure !== this.state.figure) {
			return true
		}
		if (nextProps.g_searched.length !== this.state.g_search_len || nextProps.g_searched !== this.props.g_searched) {
			/** 
			 * When the global g_searched is updated this plot will re-render!
			 * This can cause issues with a click event beeing sent multiple times when the dashboard is in highlight mode.
			*/
			return true
		}
		// If neighbouring genes is enabled => click event requires re-render
		if ((nextProps.selected_row !== this.props.selected_row  && this.state.starsign_steps > 0) || nextState.starsign_steps !== this.state.starsign_steps ) {
			return true
		}
		// We need to update the state in order to update the button color
		if (nextState.frozen_starsign_gene != this.state.frozen_starsign_gene) {
			return true
		}
		if (nextProps.is_loading !== this.props.is_loading) {
			return true
		}
		return false
	}


	/**
	 * Pass camera data to parent to update PCA Plot
	 * @param e event data
	 */
	passCameraData(e: any) {
		if(e['scene.camera'] === undefined) {
			return
		}
		if(e['scene.camera'].up){
			// coordinate ratios
			const my_camera = e['scene.camera'].eye
			const new_ratios = {
				xy: Math.round(my_camera.x / my_camera.y * 100) / 100, 
				xz: Math.round(my_camera.x / my_camera.z * 100) / 100, 
				yz: Math.round(my_camera.y / my_camera.z * 100) / 100
			}
			const old_ratios = this.state.camera_ratios

			// If ratios have changed
			if (new_ratios.xy !== old_ratios.xy || new_ratios.xz !== old_ratios.xz || new_ratios.yz !== old_ratios.yz) {
				this.props.sendCameraData(e['scene.camera'])
				this.setState({camera_ratios: new_ratios, camera: e['scene.camera']})
			}
		}
    }

	/**
	 * A dot in the plot was clicked => pass to parent
	 * @param g_name gene name
	 */
	sendClick(g_name: string){
		if (this.state.last_click_time >= (Date.now() - 500)) {
			return;
		}
		this.props.sendClick([g_name]);
		this.setState({last_click_time: Date.now()})
    }

	/**
	 * Set colors
	 * @param key pallete's name 
	 */
	set_color_palette(key: string){
		this.setState({color_palette: key}, () => {
			this.build_plot()
		})
	}

	/**
	 * Fire if the size slider was changed
	 * @param size value of the slider
	 */
	set_manual_size(size: number): void {
		if (this.state.auto_size === false) {
			this.setState( { marker_size: size }, () => {
				this.build_plot()
			} )
		}
		this.setState( { manual_size: size} )
	}

	/**
	 * Set automatic marker size
	 */
	set_auto_size(data: any): number{
		if (data === undefined) {
			data = this.props.scatterPoints
		}
		let total_points = 0;
		// overall size of all trace arrays
		for (const trace of data) {
			total_points = total_points + trace.length
		}
		// this was chosen arbitrarily
		let new_size = 40 - Math.round(total_points / 15)
		// set a minimum size arbitrarily
		if (new_size < 3) {
			new_size = 3
		} else if(new_size > 10) {
			new_size = 10
		}
		if (this.state.auto_size === true) {
			// setting the marker size if auto sizing is enabled will update the plot
			// with appropriate markers after change of dataset
			this.setState( { auto_size_px: new_size, marker_size: new_size } )
		} else {
			this.setState( { auto_size_px: new_size } )
		}
		return new_size
	}

	/**
	 * Toggle automatic sizing of plot markers
	 */
	toggle_auto_size(){
		// toggle
		const now = !this.state.auto_size
		// update markers if automatic sizing was enabled
		if (now === true) {
			this.setState( { marker_size: this.state.auto_size_px, auto_size: now}, () => {
				this.build_plot()
			})
		} else {
			this.setState({ marker_size: this.state.manual_size, auto_size: now}, () => {
				this.build_plot()
			})
		}
	}

	/**
	 * Save the plot before rendering component 
	 * => impedes the plot from reseting on legend clicks
	 */
	legendClick(e: any): boolean {
		const plot: any = document.getElementById('scatter3d')
		this.setState({figure: plot}, () => {
			this.build_plot()
		})
		return true
	}


	/**
	 * Switch between different verbosity levels
	 * @param key 'full', 'reduced' or 'none'
	 */
	switchHoverData(key: string) {
		if (key === "full") {
			this.setState({ hoverTemplate: "%{customdata[0]} <br>%{customdata[1]} <br><extra>Best hit: %{customdata[2]} <br>Best hit e-value: %{customdata[3]} <br>Taxonomic assignment: %{customdata[4]} <br>Contig name: %{customdata[5]} <br> </extra>", hover_buttons: ["primary", "secondary", "secondary"] }, () => {
				this.build_plot()
			})
		} else if(key === "reduced") {
			this.setState({hoverTemplate: "%{customdata[4]}<extra></extra>", hover_buttons: ["secondary", "primary", "secondary"]}, () => {
				this.build_plot()
			})
		} else if(key === "none") {
			this.setState({hoverTemplate: "", hover_buttons: ["secondary", "secondary", "primary"]}, () => {
				this.build_plot()
			})
		}
		
	}

	/**	
	 * Track grouped de-/selection using the scatterplot legend
	 * This is tied to onRestyle to avoid desync with onClick() events
	 * @param e restyle event
	 */
	updateLegendSelection(e: any, ) {
		const plot: any = document.getElementById('scatter3d')
		const legendonly = plot.data.filter((trace: any) => trace.visible === "legendonly")
		if (legendonly !== this.state.legendonly) {
			this.setState({legendonly: legendonly})
		}
		this.build_plot()
	}

	/**
	 * Convert API data into plotly traces
	 * @param data API data
	 * @returns list of traces
	 */
	transformData (data: any[], isolated?: number, doubleclicked?: number, noSort?: boolean): any[] {
		const searched = this.props.g_searched
		const occurrences = {Unassigned: 0}
		// Avoid NoneType Exceptions
		if (data == null) {
			return []
		}

		if (typeof isolated === "undefined") {
			isolated = -1
		}
		const my_scale = chroma.scale('Spectral');
		
		const traces: any[] = []
		for (let i = 0; i < data.length; i++) {
			const chunk = data[i]
			let x : string[] | any = [];
			let y : string[] | any = [];
            let z : string[] | any = [];

            // Label + Occurences
            const label = chunk[0]['plot_label']
			occurrences[label as keyof typeof occurrences] = 0
            const my_customdata : any = [];

			/**
			 * Apply filters
			 */
			for (const each of chunk) {
				// contig filter prequisited
				let c_match = true
				if (this.props.c_searched) {
					if(this.props.c_searched.length > 0 && !this.props.c_searched.includes(each['c_name'])) {
						c_match = false
					}
				}


				// filter by e-value
				if(parseFloat(each['bh_evalue']) < this.props.e_value && c_match) {
					x.push(each[`${this.props.dim_string}1`])
					y.push(each[`${this.props.dim_string}2`])
					z.push(each[`${this.props.dim_string}3`])
					my_customdata.push([each['plot_label'], each['g_name'], each['best_hit'], each['bh_evalue'], each['taxon_assignment'], each['c_name']])
					occurrences[label as keyof typeof occurrences] = occurrences[label as keyof typeof occurrences] + 1
				} 
				// Include unassigned data points (which usually don't have an e-value)
				else if(each['plot_label'] === 'Unassigned' && c_match) {
					x.push(each[`${this.props.dim_string}1`])
					y.push(each[`${this.props.dim_string}2`])
					z.push(each[`${this.props.dim_string}3`])
					my_customdata.push([each['plot_label'], each['g_name'], each['best_hit'], each['bh_evalue'], each['taxon_assignment'], each['c_name']])
					occurrences[label as keyof typeof occurrences] = occurrences[label as keyof typeof occurrences] + 1
				}
			}

			// Setup the plot trace
			let marker = {}
			if (searched.length > 0) {
				marker = {
					size: this.state.marker_size,
					opacity: 0.5,
					color: 'rgb(192,192,192)'
				}
			} else if (this.state.starsign_steps > 0) {
				marker = {
					size: this.state.marker_size,
					opacity: this.state.opacity
				}
			} else {
				marker = {
					size: this.state.marker_size,
					opacity: this.state.opacity
				}
			}

			// Fill with undefined data, if a trace is empty, otherwise Plotly will remove it from the legend
			if (x.length === 0) {
				x = [undefined]
				y = [undefined]
				z = [undefined]
			}

            const trace = {
                type: 'scatter3d',
                mode: 'markers',
                x: x,
                y: y,
                z: z,
                name: label,
                text: label,
				marker: marker,
				visible: true,
				customdata: my_customdata,
				hovertemplate: this.state.hoverTemplate,
				hoverinfo: "all"
            }
			if (this.state.hoverTemplate === "") {
				trace.hoverinfo = "none"
			}
            traces.push(trace)
        }

		// This fixes edge cases where c_searched my become undefined
		let my_contigs = this.props.c_searched
		if (this.props.c_searched === undefined) {
			my_contigs = []
		}

		/**
		 * The following code is used to sort the traces in the scatterplot. Plotly tracks the state of the legend selection (i.e. selected traces) by the trace index.
		 * => if the order of the traces changes, the trace selection changes as well as it is not tied to the ID of the trace
		 * => The traces MUST ONLY be re-sorted if no filter are currently applied
		 */
		if (!noSort && this.props.e_value === 1 && my_contigs.length === 0) {
			// Case I => No filter => sort by occurences
			traces.sort(function(a, b){return occurrences[b.text as keyof typeof occurrences] - occurrences[a.text as keyof typeof occurrences]})
			const new_order = []
			for (const trace of traces) {
				new_order.push(trace.name)
				trace.name = trace.name + ` (${occurrences[trace.name as keyof typeof occurrences]})`
			}
			// save current order to state
			this.setState({trace_order: new_order})
		} else {
			// If filter are currently applied => keep consistent with last sorting
			traces.sort((a, b) =>{return this.state.trace_order.lastIndexOf(a.text) - this.state.trace_order.lastIndexOf(b.text)})
			for (const trace of traces) {
				trace.name = trace.name + ` (${occurrences[trace.name as keyof typeof occurrences]})`
			}
		}

		// setup traces for selected / searched dots
		const searched_rows: any[] = []
		for (const chunk of data) {
			for (const row of chunk) {
				if (searched.includes(row['g_name'])) {
					searched_rows.push(row)
				}
			}
		}

		// New trace setup
		const x : string[] = [];
		const y : string[] = [];
        const z : string[] = [];
        const my_customdata : any = [];

		searched_rows.forEach(each => {
			// push 3D coordinates in arrays accordingly
			x.push(each[`${this.props.dim_string}1`])
			y.push(each[`${this.props.dim_string}2`])
			z.push(each[`${this.props.dim_string}3`])
			my_customdata.push([each['plot_label'], each['g_name'], each['best_hit'], each['bh_evalue'], each['taxon_assignment'], each['c_name']])
        })

		if (searched_rows.length > 0) {
			// Setup the plot trace
			const trace = {
				type: 'scatter3d',
				mode: 'markers',
				x: x,
				y: y,
				z: z,
				name: "Search results",
				text: "Search results",
				marker: {
					size: this.state.marker_size,
					symbol: "diamond",
					color: 'rgb(0,0,255)'
				},
				visible: true,
				customdata: my_customdata,
				hovermode: this.state.show_hover,
				hovertemplate: this.state.hoverTemplate,
				hoverinfo: "all"
			}

			// Hide all hover infos per user settings
			if (this.state.hoverTemplate === "") {
				trace.hoverinfo = "none"
			}
			
			traces.push(trace)
		}
		
		// Stores the color assigned to a gene in the scatterplot
		const my_color_dict : color_dict = {};
		for (let i=0; i < traces.length; i++) {
			if (traces[i].name === "Search results") {
				continue
			}
			// @ts-ignore
			const next_color = custom_color_generator(i, traces.length, this.state.color_palette)
			traces[i]['marker']['color'] = next_color;
			my_color_dict[traces[i].text as string] = next_color;
			if (doubleclicked) {
				if (i !== doubleclicked) {
					traces[i]['visible'] = "legendonly"
				}
			}
		}

		/**
		 * The following code constructs line traces between the neighbouring genes of the currently selected row
		 */
		if (this.state.starsign_steps > 0) {
			const gene_order_x : number[] = [];
			const gene_order_y : number[] = [];
			const gene_order_z : number[] = [];

			let center_gene: any = {start: 0}
			if (this.state.frozen_starsign_gene != "") {
				center_gene = this.state.frozen_starsign_gene
			} else {
				center_gene = this.props.selected_row
			}

			const ordered_genes = []
			ordered_genes.push(center_gene)

			// Create an ordered array reflecting gene order
			for (let i=0; i < this.state.starsign_steps; i++){
				if (ordered_genes[0].upstream_gene !== "") {
					const next_gene: any = this.props.main_data[ordered_genes[0].upstream_gene]
					if (next_gene.c_name === ordered_genes[0].c_name) {
						ordered_genes.unshift(next_gene)
					}
				}
				if (ordered_genes[ordered_genes.length - 1].downstream_gene !== "") {
					const next_gene: any = this.props.main_data[ordered_genes[ordered_genes.length - 1].downstream_gene]
					if (next_gene.c_name === ordered_genes[ordered_genes.length - 1].c_name) {
						ordered_genes.push(next_gene)
					}
				}
				
			}

			// Create an ordered array reflecting gene order
			const all_genes_ordered = []
			
			all_genes_ordered.push(center_gene)
			
			for (let i=0; i < this.state.starsign_steps; i++){
				if (all_genes_ordered[0].upstream_gene !== "") {
					const next_gene: any = this.props.main_data[all_genes_ordered[0].upstream_gene]
					if (next_gene.c_name === all_genes_ordered[0].c_name) {
						if (parseInt(all_genes_ordered[0].start) - parseInt(next_gene.end) > 5) {
							all_genes_ordered.unshift({
								"g_len": parseInt(all_genes_ordered[0].start) - parseInt(next_gene.end),
								"g_name": "Intergenic",
							})
						}
						all_genes_ordered.unshift(next_gene)
					}
				}
				if (all_genes_ordered[all_genes_ordered.length - 1].downstream_gene !== "") {
					const next_gene: any = this.props.main_data[all_genes_ordered[all_genes_ordered.length - 1].downstream_gene]
					if (next_gene.c_name === all_genes_ordered[all_genes_ordered.length - 1].c_name) {
						if (parseInt(next_gene.start) - parseInt(all_genes_ordered[all_genes_ordered.length - 1].end) > 5) {
							
							all_genes_ordered.push({
								"g_len": parseInt(next_gene.start) - parseInt(all_genes_ordered[all_genes_ordered.length - 1].end),
								"g_name": "Intergenic",
							})
						}
						all_genes_ordered.push(next_gene)
					}
				}

				if (all_genes_ordered[0].upstream_gene == "" && all_genes_ordered[all_genes_ordered.length - 1].downstream_gene == "") {
					break
				}
			}

			const gene_plot_traces = []
			const gene_plot_hover_template = "%{customdata[1]}:%{customdata[2]}-%{customdata[3]}<br>Best hit: %{customdata[4]} <br> e-value: %{customdata[5]}"
			const e_value_x = []
			const e_value_y =[]
			let curr_stack_pos = 0
			for (const gene of all_genes_ordered) {
				let marker = {}
				let next_hover_template = gene_plot_hover_template
				if (gene.g_name == "Intergenic") {
					marker = {
						color: "rgb(128,128,128)", // grey
						opacity: 0,
						pattern: {
							shape: "/",
						},
					}
					// Disable additional hoverdata for intergenic regions
					next_hover_template = "(region)"
				} else if(gene.g_name == this.props.selected_row.g_name) {
					marker = {
						color: "rgb(105,105,105)", //grey
						line: {
							color:  "black",
							width: 1.5
						},
						pattern: {
							shape: '/',
							fgcolor: "black",
							bgcolor: my_color_dict[gene.plot_label]
						},
					}
					if (gene.bh_evalue != "") {
						if(parseFloat(gene.bh_evalue) != 0) {
							e_value_y.push(parseFloat(gene.bh_evalue))
							e_value_x.push(curr_stack_pos + 0.5 * gene.g_len);
						}
					}
				} else {
					marker = {
						// Match the color to the color used in the 3D scatterplot
						color: my_color_dict[gene.plot_label],
						opacity: 1.0,
						line: {
							color:  "black",
							width: 1.5
						}
					}
					if (gene.bh_evalue != "") {
						if(parseFloat(gene.bh_evalue) != 0) {
							e_value_y.push(parseFloat(gene.bh_evalue))
							e_value_x.push(curr_stack_pos + 0.5 * gene.g_len);
						}
					}
				}

				const new_trace = {
					x: [gene.g_len],
					y: [''],
					name: gene.g_name,
					orientation: 'h',
					type: 'bar',
					marker: marker,
					// Hoverdata: Customdata[0] is passed in clicl events --> do not remove
					customdata: [[gene.g_name, gene.c_name, gene.start, gene.end, gene.best_hit, gene.bh_evalue]],
					hovertemplate: next_hover_template
				};
				gene_plot_traces.push(new_trace);
				curr_stack_pos += parseInt(gene.g_len)
			}
			
			// e-value scatter trace
			const e_value_customdata = []
			for (const e_value of e_value_y) {
				e_value_customdata.push([e_value])
			}
			gene_plot_traces.push({
				name: "e-value",
				x: e_value_x,
				y: e_value_y,
				type: "scatter",
				yaxis: 'y2',
				mode: 'lines+markers',
				line: {
					dash: 'dashdot',
					color: "black",
				},
				customdata: e_value_customdata,
				hovertemplate: "%{customdata[0]}"
			})
			this.setState({gene_plot_data: gene_plot_traces});

			const neighbouring_custom_data = []
			for (const gene of ordered_genes) {
				if (gene === undefined) {
					continue
				}
				gene_order_x.push(gene[`${this.props.dim_string}1`])
				gene_order_y.push(gene[`${this.props.dim_string}2`])
				gene_order_z.push(gene[`${this.props.dim_string}3`])
				neighbouring_custom_data.push([gene['plot_label'], gene['g_name'], gene['best_hit'], gene['bh_evalue'], gene['taxon_assignment'], gene['c_name']])
			}

			// Create lines connecting neighbouring genes
			console.log(all_genes_ordered)
			console.log(ordered_genes)
			const order_trace: any = {
				type: 'scatter3d',
				mode: 'lines',
				name: "Neighbouring genes",
				width: 10,
				x: gene_order_x,
				y: gene_order_y,
				z: gene_order_z,
				line: {
					color: 'black',
					width: 6
				},
				hoverinfo: 'skip'
			}

			// Create marker for neighbouring genes
			const order_stars_trace: any = {
				type: 'scatter3d',
				mode: 'markers',
				name: "Neighbouring genes",
				x: gene_order_x,
				y: gene_order_y,
				z: gene_order_z,
				marker: {
					size: this.state.marker_size,
					symbol: "diamond",
					color: 'black'
				},
				customdata: neighbouring_custom_data,
				hovertemplate: this.state.hoverTemplate
			}
			traces.push(order_trace)
			traces.push(order_stars_trace)
		}
		return [traces, my_color_dict]
	}

	/**
	 * Build the 3D scatterplot
	 * @returns Plotly Plot as React component
	 */
	build_plot(isolated?: number, doubeclicked?: number, initialBuild?: boolean): boolean {
		// Filter data
		const new_data = this.transformData(this.props.scatterPoints, isolated, doubeclicked, initialBuild)
		console.log(new_data);
		// Plot layout
		const new_layout = {
			autosize: true, 
			showlegend: true, 
			uirevision: 1,
			legend: {
				itemsizing: 'constant', 
				tracegroupgap: 1,
				hovermode: 'closest'
			},
			scene: {camera: this.state.camera},
		}
		const new_config = {scrollZoom: true, doubleClickDelay: 2000}
		// eslint-disable-next-line no-restricted-globals
		this.setState({figure: {data: new_data[0], layout: new_layout, config: new_config}, g_search_len: this.props.g_searched.length, color_dict: new_data[1]})
		return true
	}
	

	/**
	 * Export all visible points as click event
	 */
	exportVisible(): void {
		const final_selection = new Set<string>()
		for (const chunk of this.state.figure.data) {
			if(chunk['mode'] === "lines" || chunk['name'] === "Neighbouring genes" || chunk['visible'] === "legendonly") {
				continue
			}
			for (const custom_data of chunk['customdata']) {
				final_selection.add(custom_data[1])
			}
		}
		this.props.sendClick(Array.from(final_selection))
	}

	freezeStarsign(gene: any) : void {
		this.setState({frozen_starsign_gene: gene})
		if (this.state.frozen_starsign_gene != "") {
			this.setState({frozen_starsign_gene: ""})
		}
	}


	/**
	 * Render react component
	 * @returns render react component
	 */
	render() {
		return (
			<>
				<Plot
				divId='scatter3d'
				data={this.state.figure.data}
				layout={this.state.figure.layout}
				frames= {this.state.figure.frames}
				config={this.state.figure.layout}
				onClick={(e: any) => this.sendClick(e.points[0].customdata[1])}
				onRelayout={(e: any) => this.passCameraData(e)}
				useResizeHandler = {true}
				style = {{width: "100%", minHeight: 800}}
				onRestyle={(e: any) => this.updateLegendSelection(e)}
				onInitialized={(e: any) => this.passCameraData(e)}
				revision={this.state.revision}
				onUpdate={(figure) => this.setState({figure: figure})}
				/>
				{this.state.starsign_steps > 0 &&
					<FadeIn transitionDuration={700}>
						<Plot
						// @ts-ignore
						data={this.state.gene_plot_data}
						layout={{
							barmode: 'stack',
							showlegend: false,
							autosize: true,
							margin: {l: 100, r: 20, b: 50, t: 30, pad: 5},
							
							yaxis2: {
								anchor: 'x2',
								overlaying: 'y',
								ticks: 'outside',
								tickformat: '.2e',
								type: "log",
								autorange:"reversed"
							},
						}}
						style = {{width: "100%", minHeight: 150}}
						useResizeHandler={true}
						className='ml-1'
						onClick={(e: any) => this.sendClick(e.points[0].customdata[0])}
						/>
					</FadeIn>
				}
				<Row>
                    <Col xs={2}>
						<Form.Label className='md-2'>Hoverdata</Form.Label>
                        <InputGroup>
						<ButtonGroup>
								<Button variant={this.state.hover_buttons[0]} onClick={() => this.switchHoverData("full")}><span className='bi bi-eye-fill'/></Button>
								<Button variant={this.state.hover_buttons[1]} onClick={() => this.switchHoverData("reduced")}><span className='bi bi-eye'/></Button>
								<Button variant={this.state.hover_buttons[2]} onClick={() => this.switchHoverData("none")}><span className='bi bi-eye-slash'/></Button>
						</ButtonGroup>
						</InputGroup>
					</Col>
					<Col xs={1}>
						<Form.Label className='md-1'>Export</Form.Label>
						<InputGroup>
							<Button onClick={() => this.exportVisible()}>View<span className='bi bi-box-arrow-in-right ml-1'/></Button>
						</InputGroup>
					</Col>
					<Col>
						<Form.Label className='md-2'>Gene order (steps)</Form.Label>
						<InputGroup className="md-2">
							<Button disabled={!this.props.gene_order_supported} onClick={() => {if(this.state.starsign_steps > 0){this.setState({starsign_steps: this.state.starsign_steps - 1})}}}><span className="bi bi-dash-circle"></span></Button>
							<Form.Control
							placeholder="None"
							contentEditable={false}
							onChange={() => false}
							value={`${this.state.starsign_steps}`}
							disabled={!this.props.gene_order_supported}
							/>
							<Button disabled={!this.props.gene_order_supported} onClick={() => this.setState({starsign_steps: this.state.starsign_steps + 1})}><span className="bi bi-plus-circle"></span></Button>
							<Button variant='danger' disabled={(!this.props.gene_order_supported || this.state.starsign_steps === 0)} onClick={() => this.setState({starsign_steps: 0})}><span className="bi bi-x-circle"></span></Button>
							<Button variant={this.state.frozen_starsign_gene === ""  && "success" || "danger"} disabled={!this.props.gene_order_supported} onClick={() => this.freezeStarsign(this.props.selected_row)}><span className="bi bi-snow"></span></Button>
						</InputGroup>
					</Col>
					<Col xs={3}>
						<Form.Label className='md-2'>Dot size</Form.Label>
						<InputGroup className="md-2">
							<Button disabled={this.state.auto_size} onClick={() => {if(this.state.manual_size >= 2){this.set_manual_size(this.state.manual_size - 1)}}}><span className="bi bi-dash-circle"></span></Button>
							<Form.Control
							placeholder="None"
							contentEditable={false}
							onChange={() => false}
							value={`${this.state.manual_size} px`}
							style={{"width": "15px"}}
							/>
							<Button disabled={this.state.auto_size} onClick={() => this.set_manual_size(this.state.manual_size + 1)}><span className="bi bi-plus-circle"></span></Button>
							<Button onClick={() => this.toggle_auto_size()} variant={(this.state.auto_size && "success") || "secondary"}><span className={(this.state.auto_size && "bi bi-lock-fill") || "bi bi-unlock-fill"}></span>Auto</Button>
						</InputGroup>
					</Col>
					<Col xs={2}>
						<Form.Label className='md-2'>Opacity</Form.Label>
						<InputGroup className="md-2">
							<Button onClick={() => {if(this.state.opacity >= 0.1){this.setState({opacity: this.state.opacity - 0.05})}}}><span className="bi bi-dash-circle"></span></Button>
							<Form.Control
							placeholder="None"
							contentEditable={false}
							onChange={() => false}
							value={`${Math.round(this.state.opacity * 100)}%`}
							/>
							<Button onClick={() => {if(this.state.opacity <= 0.95){this.setState({opacity: this.state.opacity + 0.05})}}}><span className="bi bi-plus-circle"></span></Button>
						</InputGroup>
					</Col>
					<Col xs={2}>
						<Form.Label>Color Palette</Form.Label>
						<Form.Select
						defaultValue={"colorblind"}
						onChange={(e: any) => this.set_color_palette(e.target.value)}
						>
							{ palettes.map((each: any) => {
								return <option value={each.value}>{each.label}</option>
							})}
						</Form.Select>
					</Col>
                </Row>
			</>
		)
	}
}

export default Scatter3D;