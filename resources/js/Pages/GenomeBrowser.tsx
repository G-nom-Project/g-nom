import TopNavBar from "@/Components/TopNavBar";
import {useEffect, useState} from "react";
import { createViewState, JBrowseApp } from '@jbrowse/react-app2'
import '@fontsource/roboto'
import generateConfig from "@/Components/GenomeBrowser/configGenerator";

// For Jbrowse
type ViewModel = ReturnType<typeof createViewState>

export default function GenomeBrowser({ assembly }) {
    const [viewState, setViewState] = useState<ViewModel>();

    useEffect(() => {
        const my_config = generateConfig(assembly);
        const state = createViewState({config: my_config});
        setViewState(state);
    }, []);

    if (!viewState) {
        return null;
    }

    return(
        <>
            <TopNavBar/>
            {viewState && <JBrowseApp viewState={viewState} />}
        </>
    );
}
