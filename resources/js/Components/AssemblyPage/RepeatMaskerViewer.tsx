import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Plot from 'react-plotly.js';

const RepeatMaskerViewer = ({ repeatmasker }: { repeatmasker: any }) => {
    const [data1, setData1] = useState({});
    const [layout1, setLayout1] = useState({});
    const [data2, setData2] = useState({});
    const [layout2, setLayout2] = useState({});

    useEffect(() => {
        getElementsData();
        getElementsLayout();
        getRepetitivenessData();
        getRepetitivenessLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getElementsData = () => {
        const tracks = [];
        const sines_lengths: any[] = [];
        const sines_numbers: any[] = [];
        const lines_lengths: any[] = [];
        const lines_numbers: any[] = [];
        const ltr_elements_lengths: any[] = [];
        const ltr_elements_numbers: any[] = [];
        const dna_elements_lengths: any[] = [];
        const dna_elements_numbers: any[] = [];
        const rolling_circles_lengths: any[] = [];
        const rolling_circles_numbers: any[] = [];
        const unclassified_lengths: any[] = [];
        const unclassified_numbers: any[] = [];
        const small_rna_lengths: any[] = [];
        const small_rna_numbers: any[] = [];
        const satellites_lengths: any[] = [];
        const satellites_numbers: any[] = [];
        const simple_repeats_lengths: any[] = [];
        const simple_repeats_numbers: any[] = [];
        const low_complexity_lengths: any[] = [];
        const low_complexity_numbers: any[] = [];
        const names: string[] = [];
        repeatmasker.length > 0 &&
            repeatmasker.forEach(
                (
                    analysis: {
                        [x: string]: { toString: () => string };
                        label: string;
                        name: string;
                    },
                    index: number,
                ) => {

                    if (analysis.label) {
                        names.push(index + 1 + '. ' + analysis.label);
                    } else {
                        names.push(index + 1 + '. ' + analysis.name);
                    }
                    sines_lengths.push(analysis['sines_length']);
                    sines_numbers.push(
                        analysis['sines']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    lines_lengths.push(analysis['lines_length']);
                    lines_numbers.push(
                        analysis['lines']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    ltr_elements_lengths.push(analysis['ltr_elements_length']);
                    ltr_elements_numbers.push(
                        analysis['ltr_elements']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    dna_elements_lengths.push(analysis['dna_elements_length']);
                    dna_elements_numbers.push(
                        analysis['dna_elements']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    rolling_circles_lengths.push(
                        analysis['rolling_circles_length'],
                    );
                    rolling_circles_numbers.push(
                        analysis['rolling_circles']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    unclassified_lengths.push(analysis['unclassified_length']);
                    unclassified_numbers.push(
                        analysis['unclassified']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    small_rna_lengths.push(analysis['small_rna_length']);
                    small_rna_numbers.push(
                        analysis['small_rna']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    satellites_lengths.push(analysis['satellites_length']);
                    satellites_numbers.push(
                        analysis['satellites']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    simple_repeats_lengths.push(
                        analysis['simple_repeats_length'],
                    );
                    simple_repeats_numbers.push(
                        analysis['simple_repeats']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    low_complexity_lengths.push(
                        analysis['low_complexity_length'],
                    );
                    low_complexity_numbers.push(
                        analysis['low_complexity']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                },
            );

        sines_lengths.reverse();
        sines_numbers.reverse();
        lines_lengths.reverse();
        lines_numbers.reverse();
        ltr_elements_lengths.reverse();
        ltr_elements_numbers.reverse();
        dna_elements_lengths.reverse();
        dna_elements_numbers.reverse();
        rolling_circles_lengths.reverse();
        rolling_circles_numbers.reverse();
        unclassified_lengths.reverse();
        unclassified_numbers.reverse();
        small_rna_lengths.reverse();
        small_rna_numbers.reverse();
        satellites_lengths.reverse();
        satellites_numbers.reverse();
        simple_repeats_lengths.reverse();
        simple_repeats_numbers.reverse();
        low_complexity_lengths.reverse();
        low_complexity_numbers.reverse();
        names.reverse();

        tracks.push({
            x: sines_lengths,
            y: names,
            name: 'SINEs',
            text: sines_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: sines_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: lines_lengths,
            y: names,
            name: 'LINEs',
            text: lines_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: lines_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: ltr_elements_lengths,
            y: names,
            name: 'LTR Elements',
            text: ltr_elements_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: ltr_elements_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: dna_elements_lengths,
            y: names,
            name: 'DNA Elements',
            text: dna_elements_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: dna_elements_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: rolling_circles_lengths,
            y: names,
            name: 'Rolling-circles',
            text: rolling_circles_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: rolling_circles_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: unclassified_lengths,
            y: names,
            name: 'Unclassified',
            text: unclassified_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: unclassified_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: small_rna_lengths,
            y: names,
            name: 'Small RNA',
            text: small_rna_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: small_rna_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: satellites_lengths,
            y: names,
            text: satellites_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: satellites_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: simple_repeats_lengths,
            y: names,
            name: 'Simple repeats',
            text: simple_repeats_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: simple_repeats_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: low_complexity_lengths,
            y: names,
            name: 'Low complexity',
            text: low_complexity_lengths.map((val) => {
                return (
                    val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' bp'
                );
            }),
            customdata: low_complexity_numbers,
            hovertemplate:
                '%{label}: <br> Elements: %{customdata} </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });

        setData1(tracks);
    };

    const getElementsLayout = () => {
        setLayout1({
            title: 'Repeats',
            barmode: 'stack',
            margin: { pad: 6 },
            separator: true,
            yaxis: {
                tickangle: 25,
                automargin: true,
                title: { text: 'Masking', standoff: 10 },
                type: 'category',
                tickfont: {
                    family: 'Courier New, Courier, monospace',
                    size: 14,
                    color: 'black',
                },
            },
            xaxis: {
                automargin: true,
                title: { text: 'Bases masked', standoff: 10 },
                tickfont: {
                    family: 'Courier New, Courier, monospace',
                    size: 14,
                    color: 'black',
                },
            },
            legend: {
                orientation: 'h',
                traceorder: 'normal',
                xanchor: 'left',
                y: -0.3,
                font: {
                    size: 10,
                },
            },
        });
    };

    const getRepetitivenessData = () => {
        const tracks = [];
        const total_repetitive_length: number[] = [];
        const total_repetitive_length_absolute: any[] = [];
        const total_non_repetitive_length: number[] = [];
        const total_non_repetitive_length_absolute: any[] = [];
        const names: string[] = [];
        repeatmasker.length > 0 &&
            repeatmasker.forEach(
                (
                    analysis: {
                        [x: string]: { toString: () => string };
                        total_repetitive_length: any;
                        total_non_repetitive_length: any;
                        label: string;
                        name: string;
                    },
                    index: number,
                ) => {
                    const total =
                        analysis.total_repetitive_length +
                        analysis.total_non_repetitive_length;
                    if (analysis.label) {
                        names.push(index + 1 + '. ' + analysis.label);
                    } else {
                        names.push(index + 1 + '. ' + analysis.name);
                    }
                    total_repetitive_length.push(
                        (analysis['total_repetitive_length'] * 100) / total,
                    );
                    total_repetitive_length_absolute.push(
                        analysis['total_repetitive_length']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                    total_non_repetitive_length.push(
                        (analysis['total_non_repetitive_length'] * 100) / total,
                    );
                    total_non_repetitive_length_absolute.push(
                        analysis['total_non_repetitive_length']
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                    );
                },
            );

        total_repetitive_length.reverse();
        total_repetitive_length_absolute.reverse();
        total_non_repetitive_length.reverse();
        total_non_repetitive_length_absolute.reverse();
        names.reverse();

        tracks.push({
            x: total_repetitive_length,
            y: names,
            name: 'Repetitive length',
            text: total_repetitive_length.map((val) => {
                return Number(val).toFixed(2) + '%';
            }),
            customdata: total_repetitive_length_absolute,
            hovertemplate: '%{label}: <br> %{customdata} bp </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                color: '#E69F00',
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });
        tracks.push({
            x: total_non_repetitive_length,
            y: names,
            name: 'Non-repetitive length',
            text: total_non_repetitive_length.map((val) => {
                return Number(val).toFixed(2) + '%';
            }),
            customdata: total_non_repetitive_length_absolute,
            hovertemplate: '%{label}: <br> %{customdata} bp </br> %{text}',
            orientation: 'h',
            type: 'bar',
            marker: {
                color: '#009E73',
                line: { width: 1, color: '#515E63' },
            },
            opacity: 0.7,
            width: 0.5,
        });

        setData2(tracks);
    };

    const getRepetitivenessLayout = () => {
        setLayout2({
            title: 'Repetitiveness',
            barmode: 'stack',
            margin: { pad: 6 },
            separator: true,
            yaxis: {
                tickangle: 25,
                automargin: true,
                title: { text: 'Masking', standoff: 10 },
                type: 'category',
                tickfont: {
                    family: 'Courier New, Courier, monospace',
                    size: 14,
                    color: 'black',
                },
            },
            xaxis: {
                automargin: true,
                title: { text: '% of assembly', standoff: 10 },
                range: [0, 100],
                tick0: 0,
                dtick: 10,
                tickfont: {
                    family: 'Courier New, Courier, monospace',
                    size: 14,
                    color: 'black',
                },
                ticklen: 12,
            },
            legend: {
                orientation: 'h',
                traceorder: 'normal',
                xanchor: 'left',
                y: -0.5,
            },
        });
    };
    return (
        <Row>
            <Col>
                <Plot
                    data={data1 as any}
                    layout={layout1}
                    useResizeHandler={true}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col>
                <Plot
                    data={data2 as any}
                    layout={layout2}
                    useResizeHandler={true}
                    style={{ width: '100%' }}
                />
            </Col>
        </Row>
    );
};

export default RepeatMaskerViewer;
