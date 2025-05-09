import React from "react";
import { Accordion, Badge, Button, InputGroup, Row } from "react-bootstrap";
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';


interface Props {
    sendClick: Function
    passHighlightedGenes: any
    g_options: string[]
    global_selection: Set<string>
    highlightedGenes: Set<string>
    highlightMode: boolean
    setHighlightMode: Function
}

interface State {
    e_value: number
    show_unassigned: boolean
    g_searched: string[]
    c_searched: string[]
    valid_search: boolean
    selected_genes: string[]
    valid_gene: string
    search: string
}


// Filter Tab
class Search extends React.Component<Props, State> {
    constructor(props: any){
		super(props);
		this.state ={
            e_value: 1.0,
            show_unassigned: true,
            g_searched: [],
            c_searched: [],
            valid_search: false,
            selected_genes: [],
            valid_gene: "",
            search: "",
        }
	}  

    /**
     * Handle searchbar inputs
     * @param key seatchbar input
     */
    searchFor(key: string) {
        console.log(this.props.g_options)
        if (this.props.g_options.includes(key) && !this.state.selected_genes.includes(key)) {
            this.setState({valid_search: true, valid_gene: key, search: key})
        } 
        else {
            this.setState({valid_search: false, valid_gene: "", search: key})
        }
    }

    /**
     * Submit the current search and add it to selection if it is valid
     * @param e Button event
     */
    submit = (e: any) => {
        e.preventDefault();
        if(this.state.valid_gene !== "") {
            this.setState({valid_gene: "", valid_search: false, search: ""})
            this.props.sendClick([this.state.valid_gene])
        }
    }

    /**
     * Remove a gene name from the selection
     * @param key gene name
     */
    remove = (key: string) => {
        const my_genes = this.state.selected_genes
        const index = my_genes.indexOf(key)
        if (index > -1) {
            my_genes.splice(index, 1)
        }
        
        // this.props.sendValuesUp(my_genes)
        const new_highlights: Set<string> = this.props.highlightedGenes
        new_highlights.delete(key)
        this.props.passHighlightedGenes(this.props.highlightedGenes)
        this.setState({selected_genes: my_genes})
    }


    /**
     * Add genes from the global selection to the searched genes
     */
    addGlobalSelection(): void {
        const new_selection = this.props.highlightedGenes
        this.props.global_selection.forEach((each: any) => new_selection.add(each))
        this.props.passHighlightedGenes(new_selection)
    }

    /**
     * Add Search to global selection
     */
    async applyToGlobalSelection() {
        await this.props.setHighlightMode(false)
        this.props.sendClick(Array.from(this.props.highlightedGenes))
        await this.props.setHighlightMode(true)
    }

    /**
     * Reset currently searched genes
     */
    resetSearch(): void {
        this.setState({selected_genes: [], valid_gene: "", valid_search: false, search: ""})
        this.props.passHighlightedGenes(new Set<string>())
    }

    /**
     * Toggle Highlight mode and pass up
     */
    setHighlightMode() {
        this.props.setHighlightMode(!this.props.highlightMode)
    }


    render() {
        return (
            <>
            <Card className="m-2">
                <Card.Body>
                    <Card.Title>
                        Gene Search
                    </Card.Title>
                    <Form noValidate validated={false}>
                    <InputGroup>
                        <Form.Control
                            required
                            type="text"
                            placeholder="Enter gene name"
                            isInvalid={!this.state.valid_search}
                            value={this.state.search}
                            onChange={(e: any) => this.searchFor(e.target.value)}
                            />
                        <Button onClick={(e: any) => this.submit(e)} type="submit"><i className="bi bi-arrow-left-right"></i></Button>
                    </InputGroup>
                    </Form>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Body>
                    <Card.Title>
                        <Form.Check 
                        type="switch"
                        id="show_unassigned"
                        label="Highlight Mode"
                        defaultChecked={false}
                        checked={this.props.highlightMode}
                        onChange={() => this.setHighlightMode()}
                    />
                    </Card.Title>
                    <Row>
                    <Accordion className="mt-2">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Show selected genes</Accordion.Header>
                      <Accordion.Body>
                        {
                            Array.from(this.props.highlightedGenes).map((gene:string) => {
                                return <Badge className="m-1" onClick={() => this.remove(gene)}>{gene} <span className="bi bi-x"></span></Badge>
                            })
                        }
                      </Accordion.Body>
                    </Accordion.Item>   
                  </Accordion>
                    </Row>
                    <Row>
                        <div className="text-center mt-2">
                            <Button variant="success" className='me-2' disabled={!this.props.highlightMode} onClick={() => this.addGlobalSelection()} >Add from current selection <i className="bi bi-box-arrow-right lg" ></i></Button>
                            <Button variant="primary" className='me-2' disabled={!this.props.highlightMode} onClick={() => this.applyToGlobalSelection()}>Apply to global selection <i className="bi bi-box-arrow-in-right"></i></Button>
                            <Button variant="danger" className='md-2' disabled={!this.props.highlightMode} onClick={() => this.resetSearch()}>Reset multi-search <i className="bi bi-trash"></i></Button>
                        </div>
                    </Row>
                    
                    
                    
                </Card.Body>
            </Card>
            </>
        );
    } 
}

export { Search }