import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

interface BaseData {
    values: number[];
    labels: string[];
    type: string;
    textinfo: string;
    hoverinfo: string;
}

const BaseDistributionPlot = ({ taxa }) => {
    const [data, setData] = useState<BaseData[]>();
    const [layout, setLayout] = useState({});

    useEffect(() => {
        getData();
        getLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taxa]);

    const getData = () => {
        const values: number[] = [];
        const labels: string[] = [];
        taxa.forEach((taxon) => {
            labels.push(taxon.name);
            values.push(taxon.value);
        });

        setData([
            {
                y: values,
                x: labels,
                type: 'bar',
                //hole: 0.4,
                textinfo: 'label',
                hoverinfo: 'label+percent',
                // textposition: 'inside'
            },
        ]);
    };

    const getLayout = () => {
        setLayout({
            showlegend: false,
            title: {
                text: 'Taxonomic assignment of default gene set',
            },
            // uniformtext: { minsize: 15, mode: 'hide' }
            yaxis: {
                type: 'log',
                autorange: true,
                title: {
                    text: 'Count',
                },
            },
        });
    };
    return <Plot data={data} layout={layout} useResizeHandler={true} style={{ height: '100%' }} />;
};

export default BaseDistributionPlot;
