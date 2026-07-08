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

const CoverageThresholdsPlot = ({ coverage_data }) => {
    const [data, setData] = useState<BaseData[]>();
    const [layout, setLayout] = useState({});

    useEffect(() => {
        const total_count = sum(coverage_data.frequencies);
        const rel_freqs = coverage_data.frequencies.map((each: number) => {
            return each / total_count;
        });

        const cumulative_frequencies = [];
        for (const x of coverage_data.buckets.keys()) {
            const cum_freq = sum(rel_freqs.slice(x));
            cumulative_frequencies.push(cum_freq);
        }

        setData([
            {
                y: cumulative_frequencies,
                x: coverage_data.buckets.keys(),
                type: 'line',
                textinfo: 'label',
                hoverinfo: 'label',
            },
        ]);
        getLayout();

    }, [coverage_data]);

    const getLayout = () => {
        setLayout({
            title: {
                text: 'Coverage thresholds',
            },
            yaxis: {
                autorange: true,
                title: {
                    text: 'fraction of bp sampled >= coverage',
                },
            },
            xaxis: {
                autorange: true,
                title: {
                    text: 'coverage (#reads per bp)',
                },
            },
        });
    };
    return <Plot data={data} layout={layout} useResizeHandler={true} style={{ height: '100%' }} />;
};

export default CoverageThresholdsPlot;
