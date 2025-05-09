import React, { Component } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { Container, Form } from 'react-bootstrap';

// possible options
import options from "./diamond_cols.json"
const animatedComponents = makeAnimated();

interface Props {
    default_fields: any[]
    set_fields: any
}

interface State {
    is_valid: boolean
}


/**
 * Dropdown selector for custom fields to be displayed in the sidebar
 */
class ColumnSelector extends Component<Props, State> {
	constructor(props: Props){
        super(props)
        this.state = {  
            is_valid: false
        }
        
    }

	/**
     * Pass changed dropdown values to parent
     * @param values Dropdown values (JSON)
     */
	passSelectionUp = (values: any) => {
		return this.props.set_fields(values)
	}

    render() {
      return (
          <Container>
              <Form>
                  <Form.Group>
                      <Form.Text>Select table columns</Form.Text>
                      <Select 
                      options={options} 
                      components={animatedComponents} 
                      onChange={(e) => this.passSelectionUp(e)} 
                      defaultValue={this.props.default_fields}
                      placeholder="Select at least one column!"
                      isMulti/>
                  </Form.Group>
              </Form>
          </Container>
      );
  }
}
export default ColumnSelector;