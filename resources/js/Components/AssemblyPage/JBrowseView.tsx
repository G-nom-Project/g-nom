
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view';
import { useEffect, useState } from 'react';

const JBrowseView = ({my_assembly, annotations, mappings, location = ""}: {my_assembly: any, annotations: any, mappings: any, location: string}) => {

    const [assembly, setAssembly] = useState<any>()
    const [tracks, setTracks] = useState<any[]>();
    const [defaultSession, setDefaultSession] = useState<any>();
    const [configuration, setConfiguration] = useState<any>();
    const [aggregateTextSearchAdapters, setAggregateTextSearchAdapters] = useState<any[]>();
    const [locationState, setLocationState] = useState<string>();
    const [defaultViewState, setDefaultViewState] = useState<any>();

    console.log(my_assembly)


    useEffect(() => {
        setLocationState(location);
    }, [location]);

    useEffect(() => {
        setDefaultViewState(createViewState({
            assembly: assembly,
            tracks: tracks,
            defaultSession: defaultSession,
            configuration: configuration,
            location: locationState,
            aggregateTextSearchAdapters: aggregateTextSearchAdapters
        }))
    }, [assembly, tracks, defaultSession, configuration, locationState, aggregateTextSearchAdapters])



    useEffect(() => {
        setAssembly({
            name: my_assembly.name,
            active: true,
            sequence: {
                type: "ReferenceSequenceTrack",
                trackId: my_assembly.name + "-ReferenceSequenceTrack",
                adapter: {
                    type: "BgzipFastaAdapter",
                    fastaLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${my_assembly.taxon_id}/${my_assembly.id}/assembly.fa.gz`,
                        locationType: "UriLocation",
                    },
                    faiLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${my_assembly.taxon_id}/${my_assembly.id}/assembly.fa.gz.fai`,
                        locationType: "UriLocation",
                    },
                    gziLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${my_assembly.taxon_id}/${my_assembly.id}/assembly.fa.gz.gzi`,
                        locationType: "UriLocation",
                    },
                },
            },
        });
    }, [my_assembly]);

    useEffect(() => {
        const annotationsTracks = annotations.map((annotation, index) => {
            const fileBasename = annotation.path.split("/").reverse()[0];
            return {
                type: "FeatureTrack",
                trackId: "track_annotation_" + annotation.id,
                name: annotation.name,
                category: ["annotation"],
                assemblyNames: [my_assembly.name],
                adapter: {
                    type: "Gff3TabixAdapter",
                    gffGzLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${my_assembly.taxon_id}/${my_assembly.id}/annotations/${annotation.id}.sorted.gff3.gz`,
                        locationType: "UriLocation",
                    },
                    index: {
                        location: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${my_assembly.taxon_id}/${my_assembly.id}/annotations/${annotation.id}.sorted.gff3.gz.tbi`,
                            locationType: "UriLocation",
                        },
                        indexType: "TBI",
                    },
                },
            };
        });
        const mappingTracks = mappings.map((mapping, index) => {
            const fileBasename = mapping.path.split("/").reverse()[0];
            return {
                type: "AlignmentsTrack",
                trackId: "track_mapping_" + mapping.id,
                name: mapping.name,
                adapter: {
                    type: "BamAdapter",
                    bamLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/${fileBasename}`,
                        locationType: "UriLocation",
                    },
                    index: {
                        location: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/${fileBasename}.bai`,
                            locationType: "UriLocation",
                        },
                        indexType: "BAI",
                    },
                    sequenceAdapter: {
                        type: "BgzipFastaAdapter",
                        fastaLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/${my_assembly.name}.fasta.gz`,
                            locationType: "UriLocation",
                        },
                        faiLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/${my_assembly.name}.fasta.gz.fai`,
                            locationType: "UriLocation",
                        },
                        gziLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/${my_assembly.name}.fasta.gz.gzi`,
                            locationType: "UriLocation",
                        },
                    },
                },
                category: ["mapping"],
                assemblyNames: [my_assembly.name],
            };
        });
        setTracks([...annotationsTracks, ...mappingTracks])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [annotations])


    useEffect(() => {
        const annotationsTracks = annotations.map((annotation) => {
            return {
                type: "FeatureTrack",
                configuration: "track_annotation_" + annotation.id,
                displays: [
                    {
                        type: "LinearBasicDisplay",
                        height: 150,
                        configuration: "track_annotation_" + annotation.id + "-LinearBasicDisplay",
                    },
                ],
            };
        });
        setDefaultSession({
            name: "My session",
            view: {
                id: "linearGenomeView",
                type: "LinearGenomeView",
                tracks: [{
                    type: "ReferenceSequenceTrack",
                    configuration: my_assembly.name + "-ReferenceSequenceTrack",
                    displays: [
                        {
                            type: "LinearReferenceSequenceDisplay",
                            height: 400,
                            configuration:
                                my_assembly.name + "-ReferenceSequenceTrack-LinearReferenceSequenceDisplay",
                        },
                    ],
                },

                    ...annotationsTracks,
                ],
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [my_assembly]);

    useEffect(() => {
        setConfiguration({
            theme: {
                palette: {
                    primary: {
                        main: "#3b82f6",
                    },
                    secondary: {
                        main: "#464957",
                    },
                    tertiary: {
                        main: "#c7d2fe",
                    },
                },
            },
            logoPath: {
                uri: "logo.svg"
            },
            extraThemes: {
                "myTheme": {
                    "name": "My theme",
                    "mode": "dark",
                    "palette": {
                        "primary": {
                            "main": "#311b92"
                        },
                        "secondary": {
                            "main": "#0097a7"
                        },
                        "tertiary": {
                            "main": "#f57c00"
                        },
                        "quaternary": {
                            "main": "#d50000"
                        }
                    }
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [my_assembly]);


    useEffect(() => {
        setAggregateTextSearchAdapters([
            {
                type: "TrixTextSearchAdapter",
                textSearchAdapterId: "text_search_adapter_annotation_" + my_assembly.name,
                ixFilePath: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/trix/${my_assembly.name}.ix`,
                    locationType: "UriLocation",
                },
                ixxFilePath: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/trix/${my_assembly.name}.ixx`,
                    locationType: "UriLocation",
                },
                metaFilePath: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/assemblies/${my_assembly.name}/trix/${my_assembly.name}_meta.json`,
                    locationType: "UriLocation",
                },
                assemblyNames: [my_assembly.name],
            },
        ]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [my_assembly.name]);



    return(
        <>
            {assembly?.name && <JBrowseLinearGenomeView viewState={defaultViewState} />}
        </>
    )
}

export default JBrowseView;
