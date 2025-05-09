import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const BaseDistributionPlot = ({ assembly}:{assembly: any}) => {
    const [data, setData] = useState<any>();
    const [layout, setLayout] = useState<any>();

    useEffect(() => {
        getData();
        getLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assembly?.id]);

    const getData = () => {
        const charCount = JSON.parse(assembly.charCountString);

        let values: number[] = [];
        let labels: string[] = [];
        Object.keys(charCount).forEach((char) => {
            labels.push(char);
            values.push(charCount[char]);
        });

        setData([
            {
                values: values,
                labels: labels,
                type: "pie",
                textinfo: "label+percent",
                hoverinfo: "label+value",
                marker: {
                    colors: ["#E69F00", "#56B4E9", "#009E73", "#0072B2", "#D55E00"],
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
                xanchor: "center",
                orientation: "v",
            },
        });
    };

    return (
        <Plot data={data} layout={layout} useResizeHandler={true} style={{width: "100%"}}/>
    );
};

export default BaseDistributionPlot;
