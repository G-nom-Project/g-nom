import { Component } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

interface Props {
    passCols: (cols: any) => void
    options: any[]
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
            selection: [{ "label": "Seq ID", "value": "sseqid" }]
        }
    }

    /**
     * Update state and pass selection up
     * @param selection event emitted by <Select>
     */
    updateSelection(selection: any) {
        this.props.passCols(selection)
        this.setState({selection: selection})
    }


    render() {
        return (
            <div>
                <Select
                    options={this.props.options}
                    components={animatedComponents}
                    isMulti defaultValue={["A", "C"]}
                    value={this.state.selection}
                    onChange={(e: any) => this.updateSelection(e)}
                    isClearable={false}
                    isDisabled={this.state.synced}/>
            </div>
        )
    }
}

export default ColumnSelector
