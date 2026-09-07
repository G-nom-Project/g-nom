import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import CompositionBar from '@/Components/CompositionBar';
import { useEffect, useState } from 'react';
import { fCatAnalysis } from '@/types/data';

type fCatCompletenessBarProps = {
    analysis: fCatAnalysis;
};

export default function FCatCompletenessBar({ analysis }: fCatCompletenessBarProps) {
    const [clicks, setClicks] = useState<number>(0);
    const [current, setCurrent] = useState({
        similar: Math.round(analysis['m1_similarPercent'] * 100) / 100,
        duplicated: Math.round(analysis['m1_duplicatedPercent'] * 100) / 100,
        dissimilar: Math.round(analysis['m1_dissimilarPercent'] * 100) / 100,
        missing: Math.round(analysis['m1_missingPercent'] * 100) / 100,
        ignored: Math.round(analysis['m1_ignoredPercent'] * 100) / 100,
    });
    const modes = ['m1', 'm2', 'm3', 'm4'];

    useEffect(() => {
        setCurrent({
            similar: Math.round(analysis[modes[clicks % 4] + '_similarPercent'] * 100) / 100,
            duplicated: Math.round(analysis[modes[clicks % 4] + '_duplicatedPercent'] * 100) / 100,
            dissimilar: Math.round(analysis[modes[clicks % 4] + '_dissimilarPercent'] * 100) / 100,
            missing: Math.round(analysis[modes[clicks % 4] + '_missingPercent'] * 100) / 100,
            ignored: Math.round(analysis[modes[clicks % 4] + '_ignoredPercent'] * 100) / 100,
        });
    }, [clicks]);

    const generateBar = () => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setClicks(clicks + 1)}>
                <span style={{ width: '15%' }}>
                    <b className="text-muted">fCat</b>
                </span>

                <CompositionBar
                    values={[current.similar, current.duplicated, current.dissimilar, current.missing, current.ignored]}
                    colors={['#2da44e', '#0969da', '#d4a72c', '#cf222e', '#858585']}
                />
            </div>
        );
    };

    return (
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip>
                    <b>Similar:</b> {current.similar}%
                    <br />
                    <b>Duplicated:</b> {current.duplicated}%
                    <br />
                    <b>Dissimilar:</b> {current.dissimilar}%
                    <br />
                    <b>Missing:</b> {current.missing}%
                    <br />
                    <b>Ignored:</b> {current.ignored}%
                    <br />
                    <i>Mode {modes[clicks % 4].slice(1)}</i>
                </Tooltip>
            }
        >
            {generateBar()}
        </OverlayTrigger>
    );
}
