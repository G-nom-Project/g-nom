import { useEffect, useState } from 'react';
import { Row, Col, Card, ListGroup, Button } from "react-bootstrap";
import Plot from 'react-plotly.js';

const BuscoViewer = ({ busco }:{busco: any}) => {
    const [data, setData] = useState<any>({});
    const [layout, setLayout] = useState({});

    useEffect(() => {
        getBuscoData();
        getBuscoLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getBuscoData = () => {
        const colors = ["#009E73", "#56B4E9", "#E69F00", "#0072B2", "#D55E00"];


        let tracks = [];
        let complete: any[] = [];
        let complete_absolute: any[] = [];
        let duplicated: any[] = [];
        let duplicated_absolute: any[] = [];
        let fragmented: any[] = [];
        let fragmented_absolute: any[] = [];
        let missing: any[] = [];
        let missing_absolute: any[] = [];
        let names: string[] = [];
        busco.length > 0 &&
        busco.forEach((analysis: any, index: any) => {
            let total =
                analysis.completeSingle +
                analysis.completeDuplicated +
                analysis.fragmented +
                analysis.missing;
            if (analysis.label) {
                names.push(index + 1 + ". " + analysis.label);
            } else if (analysis.dataset) {
                names.push(index + 1 + ". " + analysis.dataset);
            } else {
                names.push(index + 1 + ". " + analysis.name);
            }
            complete.push((analysis.completeSingle * 100) / total);
            complete_absolute.push(analysis.completeSingle + "/" + total);
            duplicated.push((analysis.completeDuplicated * 100) / total);
            duplicated_absolute.push(analysis.completeDuplicated + "/" + total);
            fragmented.push((analysis.fragmented * 100) / total);
            fragmented_absolute.push(analysis.fragmented + "/" + total);
            missing.push((analysis.missing * 100) / total);
            missing_absolute.push(analysis.missing + "/" + total);
        });

        names.reverse();
        complete.reverse();
        complete_absolute.reverse();
        duplicated.reverse();
        duplicated_absolute.reverse();
        fragmented.reverse();
        fragmented_absolute.reverse();
        missing.reverse();
        missing_absolute.reverse();

        tracks.push({
            x: complete,
            y: names,
            name: "complete (S)",
            text: complete.map((val) => {
                return "C (S): " + Number(val).toFixed(2);
            }),
            customdata: complete_absolute,
            hovertemplate: "%{label}: <br> %{customdata} </br> %{text}",
            orientation: "h",
            type: "bar",
            marker: {
                color: colors[0],
                line: { width: 1, color: "#515E63" },
            },
            width: 0.4,
        });
        tracks.push({
            x: duplicated,
            y: names,
            name: "complete (D)",
            text: duplicated.map((val) => {
                return "C (D): " + Number(val).toFixed(2);
            }),
            customdata: duplicated_absolute,
            hovertemplate: "%{label}: <br> %{customdata} </br> %{text}",
            orientation: "h",
            type: "bar",
            marker: {
                color: colors[1],
                line: { width: 1, color: "#515E63" },
            },
            width: 0.4,
        });
        tracks.push({
            x: fragmented,
            y: names,
            name: "fragmented",
            text: fragmented.map((val) => {
                return "F: " + Number(val).toFixed(2);
            }),
            customdata: fragmented_absolute,
            hovertemplate: "%{label}: <br> %{customdata} </br> %{text}",
            orientation: "h",
            type: "bar",
            marker: {
                color: colors[2],
                line: { width: 1, color: "#515E63" },
            },
            width: 0.4,
        });
        tracks.push({
            x: missing,
            y: names,
            name: "missing",
            text: missing.map((val) => {
                return "M: " + Number(val).toFixed(2);
            }),
            customdata: missing_absolute,
            hovertemplate: "%{label}: <br> %{customdata} </br> %{text}",
            orientation: "h",
            type: "bar",
            marker: {
                color: colors[3],
                line: { width: 1, color: "#515E63" },
            },
            width: 0.4,
        });

        setData(tracks);
    };

    const getBuscoLayout = () => {
        setLayout({
            title: "Busco completeness",
            barmode: "stack",
            autosize: true,
            margin: { pad: 6 },
            yaxis: {
                tickangle: 25,
                automargin: true,
                type: "category",
                title: { text: "Analysis", standoff: 10 },
            },
            xaxis: {
                automargin: true,
                title: { text: "% of sequences", standoff: 10 },
                range: [0, 100],
                tick0: 0,
                dtick: 10,
                ticklen: 12,
            },
            dragmode: false,
            separator: true,
            legend: {
                orientation: "h",
                traceorder: "normal",
                xanchor: "left",
                y: -0.3,
            },
        });
    };

    return (
        <Row>
            <Col xs={8}>
                <Plot
                    layout={layout}
                    data={data}
                    useResizeHandler={true}
                    style={{width: "100%"}}/>
            </Col>
            <Col>
                <Card className="shadow">
                    <Card.Body>
                        <Card.Title>Busco analysis</Card.Title>
                        <Card.Subtitle><div className="text-muted">{busco[0].name}</div></Card.Subtitle>
                    </Card.Body>
                    <ListGroup className="list-group-flush">
                        <ListGroup.Item>
                            <b>Busco mode:</b> {busco[0].buscoMode}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <b>Dataset:</b> {busco[0].dataset}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <b>Added:</b> {busco[0].addedOn}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <b>Downloads:</b><br/><Button className="mt-1"><i className="bi bi-download"/>  BUSCO results</Button> {'  '} <Button className="mt-1"><i className="bi bi-download"/>  Target FASTA</Button>
                        </ListGroup.Item>
                    </ListGroup>
                </Card>
            </Col>
        </Row>
    );
};

export default BuscoViewer;
