import generateConfig from '@/Components/GenomeBrowser/configGenerator';
import TopNavBar from '@/Components/TopNavBar';
import '@fontsource/roboto';
import { createViewState, JBrowseApp } from '@jbrowse/react-app2';
import { useEffect, useState } from 'react';

// For Jbrowse
type ViewModel = ReturnType<typeof createViewState>;

export default function GenomeBrowser({ assembly }) {
    const [viewState, setViewState] = useState<ViewModel>();

    useEffect(() => {
        const params = new URL(location.href).searchParams;
        const my_config = generateConfig(assembly, params.get('location'));
        const state = createViewState({ config: my_config });
        setViewState(state);
    }, [assembly]);

    if (!viewState) {
        return null;
    }

    return (
        <>
            <TopNavBar />
            {viewState && <JBrowseApp viewState={viewState} />}
        </>
    );
}
