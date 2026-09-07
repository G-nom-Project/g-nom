import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import CompositionBar from '@/Components/CompositionBar';
import { useEffect, useState } from 'react';
import { BuscoAnalysis } from '@/types/data';

type CompletenessBarProps = {
    analyses: BuscoAnalysis[];
    name?: string;
};

export default function BUSCOCompletenessBar({ analyses, name = 'BUSCO'}: CompletenessBarProps) {
    const [current, setCurrent] = useState<BuscoAnalysis | null>();

    useEffect(() => {
        if (analyses.length > 0) {
            setCurrent(analyses[0]);
        }
    },[analyses]);

    const generateBar = () => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '15%' }}>
                    <b className="text-muted">{name}</b>
                </span>
                { current &&
                    <CompositionBar
                        values={[
                            Math.round(current.completeSinglePercent * 100) / 100,
                            Math.round(current.completeDuplicatedPercent * 100) / 100,
                            Math.round(current.fragmentedPercent * 100) / 100,
                            Math.round(current.missingPercent * 100) / 100,
                        ]}
                        colors={[
                            '#2da44e', // complete
                            '#0969da', // complete duplicated
                            '#d4a72c', // fragmented
                            '#cf222e', // missing
                        ]}
                    />
                }
            </div>
        );
    }

    return (
        <>
            {(current && (
                <OverlayTrigger
                    placement="top"
                    overlay={
                        <Tooltip>
                            <b>Complete:</b> {Math.round(current.completeSinglePercent * 100) / 100}%
                            <br />
                            <b>Duplicated:</b> {Math.round(current.completeDuplicatedPercent * 100) / 100}%
                            <br />
                            <b>Fragmented:</b> {Math.round(current.fragmentedPercent*100)/100}%
                            <br />
                            <b>Missing:</b> {Math.round(current.missingPercent*100)/100}%
                            <br />
                            {current.buscoMode}
                            <br />
                            <i>{current.dataset}</i>
                        </Tooltip>
                    }
                >
                    {generateBar()}
                </OverlayTrigger>
            )) || (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '15%' }}>
                        <b className="text-muted">{name}</b>
                    </span>

                    <CompositionBar
                        values={[-1, -1, -1, -1]}
                        colors={[
                            '#2da44e', // complete
                            '#0969da', // complete duplicated
                            '#d4a72c', // fragmented
                            '#cf222e', // missing
                        ]}
                    />
                </div>
            )}
        </>
    );
}
