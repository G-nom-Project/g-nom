import { Assembly } from '@/types/data';
import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

interface BaseData {
    values: number[];
    labels: string[];
    type: string;
    textinfo: string;
    hoverinfo: string;
    marker: { colors: string[] };
}

const BaseDistributionPlot = ({ assembly }: { assembly: Assembly }) => {
    const [data, setData] = useState<BaseData[]>();
    const [layout, setLayout] = useState({});

    useEffect(() => {
        getData();
        getLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assembly?.id]);

    const getData = () => {
        const charCount = JSON.parse(assembly.charCountString);

        const values: number[] = [];
        const labels: string[] = [];
        Object.keys(charCount).forEach((char) => {
            labels.push(char);
            values.push(charCount[char]);
        });

        setData([
            {
                values: values,
                labels: labels,
                type: 'pie',
                textinfo: 'label+percent',
                hoverinfo: 'label+value',
                marker: {
                    colors: ['#E69F00', '#56B4E9', '#009E73', '#0072B2', '#D55E00'],
                },
            },
        ]);
    };

    const getLayout = () => {
        setLayout({
            showlegend: true,
            automargin: true,
            autosize: true,
            legend: {
                x: 1,
                y: 1,
                xanchor: 'center',
                orientation: 'v',
            },
        });
    };

    return <Plot data={data} layout={layout} useResizeHandler={true} style={{ width: '100%' }} />;
};

export default BaseDistributionPlot;
