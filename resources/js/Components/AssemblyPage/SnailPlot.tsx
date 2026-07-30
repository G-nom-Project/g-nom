import { useEffect, useState } from 'react';
import { Assembly} from '@/Components/AssemblyPage/snail';
import * as d3 from 'd3';
import MissingData from '@/Components/MissingData';

const SnailPlot = ({taxon_id, assembly_id}:{taxon_id: number, assembly_id: number}) => {
    const [errorDiv, setErrorDiv] = useState();
    useEffect(() => {
        d3.json(import.meta.env.VITE_JBROWSE_ADRESS + `/taxa/${taxon_id}/${assembly_id}/snail.json`)
            .then((json) => {
                const asm = new Assembly(json);
                asm.drawPlot('assembly_stats');
            })
            .catch(() => {
                return setErrorDiv(
                    <MissingData msg={"Required assembly stats could not be loaded"}/>
                );
            });
    }, [assembly_id, taxon_id]);
    return <div id="assembly_stats" style={{ width: '100%', height: '100%'}}>{errorDiv}</div>;
}

export default SnailPlot;
