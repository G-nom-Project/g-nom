import { useEffect, useState } from "react";
import propTypes from "prop-types";
import { Button, Card, Col, ListGroup, Row, Form } from "react-bootstrap";
import Plot from "react-plotly.js";

const FcatViewer = ({ fcat }: {taxon: any, assembly: any, fcat: any}) => {
    const [mode, setMode] = useState(1);
    const [data, setData] = useState({});
    const [layout, setLayout] = useState({});


    useEffect(() => {
        getFcatData();
        getFcatLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const getFcatData = () => {
        const colors = ["#009E73", "#56B4E9", "#E69F00", "#0072B2", "#D55E00"];

        let activeMode = mode;
        let tracks = [];
        let similar: number[] = [];
        let similar_absolute: string[] = [];
        let duplicated: number[] = [];
        let duplicated_absolute: string[] = [];
        let dissimilar: number[] = [];
        let dissimilar_absolute: string[] = [];
        let missing: number[] = [];
        let missing_absolute: string[] = [];
        let ignored: number[] = [];
        let ignored_absolute: string[] = [];
        let names: string[] = [];
        fcat.length > 0 &&
        fcat.forEach((analysis: { [x: string]: string; label: string; name: string; }, index: number) => {
            let total = parseInt(
                analysis["m" + activeMode + "_similar"] +
                analysis["m" + activeMode + "_duplicated"] +
                analysis["m" + activeMode + "_dissimilar"] +
                analysis["m" + activeMode + "_missing"] +
                analysis["m" + activeMode + "_ignored"]);
            if (analysis.label) {
                names.push(index + 1 + ". " + analysis.label);
            } else {
                names.push(index + 1 + ". " + analysis.name);
            }
            similar.push((parseInt(analysis["m" + activeMode + "_similar"]) * 100) / total);
            similar_absolute.push(analysis["m" + activeMode + "_similar"] + "/" + total);
            duplicated.push((parseInt(analysis["m" + activeMode + "_duplicated"]) * 100) / total);
            duplicated_absolute.push(analysis["m" + activeMode + "_duplicated"] + "/" + total);
            dissimilar.push((parseInt(analysis["m" + activeMode + "_dissimilar"]) * 100) / total);
            dissimilar_absolute.push(analysis["m" + activeMode + "_dissimilar"] + "/" + total);
            missing.push((parseInt(analysis["m" + activeMode + "_missing"]) * 100) / total);
            missing_absolute.push(analysis["m" + activeMode + "_missing"] + "/" + total);
            ignored.push((parseInt(analysis["m" + activeMode + "_ignored"]) * 100) / total);
            ignored_absolute.push(analysis["m" + activeMode + "_ignored"] + "/" + total);
        });

        names.reverse();
        similar.reverse();
        similar_absolute.reverse();
        duplicated.reverse();
        duplicated_absolute.reverse();
        dissimilar.reverse();
        dissimilar_absolute.reverse();
        missing.reverse();
        missing_absolute.reverse();
        ignored.reverse();
        ignored_absolute.reverse();

        tracks.push({
            x: similar,
            y: names,
            name: "similar",
            text: similar.map((val) => {
                return "S: " + Number(val).toFixed(2);
            }),
            customdata: similar_absolute,
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
            name: "duplicated",
            text: duplicated.map((val) => {
                return "Du: " + Number(val).toFixed(2);
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
            x: dissimilar,
            y: names,
            name: "dissimilar",
            text: dissimilar.map((val) => {
                return "Di: " + Number(val).toFixed(2);
            }),
            customdata: dissimilar_absolute,
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
        tracks.push({
            x: ignored,
            y: names,
            name: "ignored",
            text: ignored.map((val) => {
                return "I: " + Number(val).toFixed(2);
            }),
            orientation: "h",
            type: "bar",
            marker: {
                color: colors[4],
                line: { width: 1, color: "#515E63" },
            },
            width: 0.4,
        });

        setData(tracks);
    };

    const getFcatLayout = () => {
        setLayout({
            title: "fCat completeness",
            barmode: "stack",
            margin: { pad: 6 },
            transition: {
                duration: 300,
            },
            dragmode: false,
            separator: true,
            yaxis: {
                tickangle: 25,
                automargin: true,
                title: { text: "Analysis", standoff: 10 },
                tickfont: {
                    family: "Courier New, Courier, monospace",
                    size: 14,
                    color: "black",
                },
            },
            xaxis: {
                automargin: true,
                title: { text: "% of sequences", standoff: 10 },
                range: [0, 100],
                tick0: 0,
                dtick: 10,
                tickfont: {
                    family: "Courier New, Courier, monospace",
                    size: 14,
                    color: "black",
                },
                ticklen: 12,
            },
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
                    data={data as any}
                    useResizeHandler={true}
                    style={{width: "100%"}}/>
            </Col>
            <Col>
                <Card className="shadow">
                    <Card.Body>
                        <Card.Title>fCat analysis</Card.Title>
                        <Card.Subtitle><div className="text-muted">{fcat[0].name}</div></Card.Subtitle>
                    </Card.Body>
                    <ListGroup className="list-group-flush">
                        <ListGroup.Item>
                            <b>fCat Mode:</b>
                            <Form.Select value={mode} onChange={(e: any) => setMode(e.target.value)}>
                                <option value={1}>Mode 1</option>
                                <option value={2}>Mode 2</option>
                                <option value={3}>Mode 3</option>
                                <option value={4}>Mode 4</option>
                            </Form.Select>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <b>genomeID:</b> {fcat[0].genomeID}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <b>Added:</b> {fcat[0].addedOn}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <b>Downloads:</b><br/><Button className="mt-1"><i className="bi bi-download"/>  fCat results</Button>
                        </ListGroup.Item>
                    </ListGroup>
                </Card>
            </Col>

        </Row>
    );
};

export default FcatViewer;

FcatViewer.defaultProps = { busco: [], fcat: [] };

FcatViewer.propTypes = {
    busco: propTypes.array,
    fcat: propTypes.array,
};
