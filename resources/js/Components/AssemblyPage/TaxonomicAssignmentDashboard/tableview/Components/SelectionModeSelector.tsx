import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { Row, Col } from 'react-bootstrap';
import { fetchTaxaminerDownload } from '../../api';

interface Props {
  passMode: Function
  resetSelection: Function
  selection: Set<string>
  analysisID: number
  assemblyID: number
  userID: number
  token: string
  main_data: any
  passCsvExport: Function
}

/**
 *
 * @param props passMode, selection
 * @returns
 */
function SelectionModeSelector(props: Props) {
  const [mode, SetMode] = useState('neutral');

  // lift mode up
  useEffect(() => {
    props.passMode(mode)
  }, [mode])

  /**
   * Download the selected data in a specified files format
   * @param type file format
   */
  function download_file(type: string) {
    // Create file blob
    fetchTaxaminerDownload(props.assemblyID, props.analysisID, "fasta", Array.from(props.selection))
    .then((data: any) => {
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(data);
      a.download = "selection." + type;
      a.click();
    });
  }

   /**
   * JSON download
   */
   function download_json() {
    const all_json = Array.from(props.selection).map((each: string) => {
      return props.main_data[each]
    })
    const a = document.createElement("a");
    // pretty print
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(all_json, null, 2)));
    // set as download
    a.setAttribute('download', "selection.json");
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // clean up
    document.body.removeChild(a);

  }

  return (
    <div>
      <Row className='mt-2'>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Edit Mode</Card.Title>
              <Row className="m-2">
              <ButtonGroup style={{width: "100%"}}>
                <Button variant="success" onClick={() => SetMode('add')} disabled={mode === 'add'} className='btn-block'>+</Button>
                <Button variant="secondary" onClick={() => SetMode('neutral')} disabled={mode === 'neutral' } className='btn-block'>o</Button>
                <Button variant="danger" onClick={() => SetMode('remove')} disabled={mode === 'remove'} className='btn-block'>-</Button>
              </ButtonGroup>
              </Row>
              <Row className='m-2'>
                <Button className='md-2' variant="danger" onClick={() => props.resetSelection()}>Reset</Button>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
          <Card.Body>
            <Card.Title>Export data</Card.Title>
            <ButtonGroup className='md-2' style={{width: "100%"}}>
              <Button variant="primary" className='btn-block' onClick={() => download_file("fasta")}>FASTA</Button>
              <Button variant="primary" className='btn-block' onClick={() => props.passCsvExport()}>CSV</Button>
              <Button variant="primary" className='btn-block' onClick={() => download_json()}>JSON</Button>
            </ButtonGroup>
          </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SelectionModeSelector
