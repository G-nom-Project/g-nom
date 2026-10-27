import generateConfig from '@/Components/GenomeBrowser/configGenerator';
import TopNavBar from '@/Components/TopNavBar';
//import '@fontsource/roboto';
import { createViewState, JBrowseApp } from '@jbrowse/react-app2';
import { useEffect, useState } from 'react';
import { Assembly } from '@/types/data';
import { getEnv } from '@jbrowse/core/util';
import { usePage } from '@inertiajs/react';


type ViewModel = ReturnType<typeof createViewState>;

export default function GenomeBrowser({ assembly }:{assembly: Assembly}) {
    const [viewState, setViewState] = useState<ViewModel>();
    const app_url = usePage().props.gnom.app_url;

    useEffect(() => {

        ;(async () => {
            // Check for URL search parameters indicating a desired locus
            const params = new URL(location.href).searchParams;
            const my_config = generateConfig(assembly, params.get('location') as string, app_url);

            const loc_string = params.get('location')

            const state = createViewState({ config: my_config });
            const { pluginManager } = getEnv(state);
            setViewState(state);

            if (loc_string) {
                const partials = loc_string.split('|');
                await pluginManager.evaluateAsyncExtensionPoint('LaunchView-LinearGenomeView', {
                    tracks: ['current_hit', 'repeatmasker'],
                    loc: `${partials[0]}:${partials[1]}-${partials[2]}`,
                    assembly: assembly.name,
                    session: state.session,
                });
            } else {
                await pluginManager.evaluateAsyncExtensionPoint('LaunchView-LinearGenomeView', {
                    tracks: ['repeatmasker'],
                    assembly: assembly.name,
                    loc: '',
                    session: state.session,
                });
            }

        })();
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
