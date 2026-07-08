import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { sum } from 'd3';

interface BaseData {
    values: number[];
    labels: string[];
    type: string;
    textinfo: string;
    hoverinfo: string;
}

const CoverageDistributionPlot = ({ coverage_data }) => {
    const [data, setData] = useState<BaseData[]>();
    const [layout, setLayout] = useState({});

    useEffect(() => {
        const sample_count = sum(coverage_data.frequencies);

        // Calculate the mean read coverage
        const total_counts = Array(coverage_data.frequencies.length).keys().map((i) => {
            return coverage_data.frequencies[i] * coverage_data.buckets[i]
        });
        const mean = sum(total_counts) / sample_count;
        setData([
            {
                y: coverage_data.frequencies,
                x: coverage_data.buckets,
                type: 'line',
                textinfo: 'label',
                hoverinfo: 'label',
            },
        ]);

        setLayout({
            title: {
                text: 'Coverage distribution (mean=' + mean.toFixed(1) + ')',
            },
            yaxis: {
                autorange: true,
                title: {
                    text: 'bp sampled',
                },
            },
            xaxis: {
                autorange: true,
                title: {
                    text: 'coverage (#reads per bp',
                },
            },
        });

    }, [coverage_data]);

    return <Plot data={data} layout={layout} useResizeHandler={true} style={{ height: '100%' }}/>;
};

export default CoverageDistributionPlot;
