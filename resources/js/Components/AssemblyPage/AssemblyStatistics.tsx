import { Assembly, SeqLengthMarker } from '@/types/data';
import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const AssemblyStatistics = ({ assembly }: { assembly: Assembly }) => {
    const [data, setData] = useState<SeqLengthMarker[]>([]);
    const [layout, setLayout] = useState({});
    console.log(assembly);

    useEffect(() => {
        getData();
        getLayout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assembly]);

    const getData = () => {
        const length_distribution = JSON.parse(assembly.lengthDistributionString);
        const sequence_length = length_distribution[0]['l'];

        let cumulativeLengths: { x: number; y: number }[] = [];
        const x1: string[] = [];
        const y1: number[] = [];
        Object.keys(length_distribution).forEach((key) => {
            cumulativeLengths.push({
                y: parseInt(length_distribution[key]['l']),
                x: parseInt(key),
            });
        });

        cumulativeLengths = cumulativeLengths.sort((a, b) => {
            if (a.x > b.x) {
                return 1;
            }
            if (a.x < b.x) {
                return -1;
            }
            return 0;
        });

        while (
            cumulativeLengths[cumulativeLengths.length - 1].y === 0 ||
            (isNaN(cumulativeLengths[cumulativeLengths.length - 1].y) && cumulativeLengths.length)
        ) {
            cumulativeLengths.pop();
        }

        let cumulative = 0;
        cumulativeLengths.forEach((element) => {
            cumulative = sequence_length - element.y;
            x1.push('>' + (element.x / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            y1.push(cumulative);
        });

        let numbersequences: { y: string; x: number }[] = [];
        const x2: string[] = [];
        const y2: number[] = [];
        Object.keys(length_distribution).forEach((key) => {
            numbersequences.push({
                y: length_distribution[key]['n'],
                x: parseInt(key),
            });
        });

        numbersequences = numbersequences.sort((a, b) => {
            return a.x > b.x ? 0 : -1;
        });

        while (
            numbersequences[numbersequences.length - 1].y === 0 ||
            (isNaN(numbersequences[numbersequences.length - 1].y) && numbersequences.length)
        ) {
            numbersequences.pop();
        }

        numbersequences.forEach((element) => {
            x2.push('>' + (element.x / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            y2.push(element.y);
        });

        console.log(y1, y2);

        const data = [
            {
                x: x1,
                y: y1,
                mode: 'markers',
                type: 'bar',
                yaxis: 'y',
                opacity: 0.5,
                name: 'Cumulative sequence length',
                marker: { color: 'grey' },
            },
            {
                x: x2,
                y: y2,
                type: 'bar',
                yaxis: 'y2',
                opacity: 1,
                name: '# of sequences',
                marker: { color: 'orange' },
            },
        ];
        console.log(data);
        setData(data);
    };

    const getLayout = () => {
        const layout = {
            showlegend: true,
            legend: {
                x: 0.1,
                y: -0.7,
                xanchor: 'center',
            },
            xaxis: {
                type: 'category',
                title: { text: 'Contig size (kb)', standoff: 10 },
                tickangle: 45,
                automargin: true,
                ticklen: 12,
            },
            yaxis: {
                title: {
                    text: 'Cumulative sequence length > x',
                    standoff: 20,
                },
                side: 'right',
                overlaying: 'y2',
                color: 'grey',
                ticklen: 12,
                automargin: true,
            },
            yaxis2: {
                title: {
                    text: '# of sequences > x',
                    standoff: 20,
                },
                side: 'left',
                tickfont: {
                    family: 'Old Standard TT, serif',
                    size: 14,
                    color: 'black',
                },
                ticklen: 12,
                automargin: true,
            },
        };
        setLayout(layout);
    };

    return <Plot data={data} layout={layout} useResizeHandler={true} style={{ width: '100%' }} />;
};

export default AssemblyStatistics;
