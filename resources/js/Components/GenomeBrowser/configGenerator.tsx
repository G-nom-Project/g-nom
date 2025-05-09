const generateConfig = (assembly) => {
    // Convert Annotations into JBrowse Tracks
    console.log(assembly)
    const annotations = assembly.genomic_annotations.map((annotation) => {
        const fileBasename = "sorted.gff3.gz";
        return {
            type: 'FeatureTrack',
            trackId: 'track_annotation_' + annotation.id,
            name: annotation.name,
            category: ['annotation'],
            assemblyNames: [assembly.name],
            adapter: {
                type: 'Gff3TabixAdapter',
                gffGzLocation: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.id}/annotations/${annotation.id}.${fileBasename}`,
                    locationType: 'UriLocation',
                },
                index: {
                    location: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.id}/annotations/${annotation.id}.${fileBasename}.tbi`,
                        locationType: 'UriLocation',
                    },
                    indexType: 'TBI',
                },
            },
        };
    });

    // Convert Mappings into JBrowse Tracks
    const mappings = assembly.mappings.map((mapping) => {
        const fileBasename = mapping.path.split('/').reverse()[0];
        let verbose_name = mapping.name;
        if (mapping.label) {
            verbose_name = mapping.label;
        }
        return {
            type: 'AlignmentsTrack',
            trackId: 'track_mapping_' + mapping.id,
            name: verbose_name,
            adapter: {
                type: 'BamAdapter',
                bamLocation: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${fileBasename}`,
                    locationType: 'UriLocation',
                },
                index: {
                    location: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${fileBasename}.bai`,
                        locationType: 'UriLocation',
                    },
                    indexType: 'BAI',
                },
                sequenceAdapter: {
                    type: 'BgzipFastaAdapter',
                    fastaLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.name}`,
                        locationType: 'UriLocation',
                    },
                    faiLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.name}.fai`,
                        locationType: 'UriLocation',
                    },
                    gziLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.name}.gzi`,
                        locationType: 'UriLocation',
                    },
                },
            },
            category: ['mapping'],
            assemblyNames: [assembly.name],
        };
    });

    const config = {
        assemblies: [
            {
                name: assembly.name,
                sequence: {
                    type: 'ReferenceSequenceTrack',
                    trackId: `${assembly.name}-Sequence`,
                    adapter: {
                        type: 'BgzipFastaAdapter',
                        fastaLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.id}/assembly.fa.gz`,
                            locationType: "UriLocation"
                        },
                        faiLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.id}/assembly.fa.gz.fai`,
                            locationType: "UriLocation"
                        },
                        gziLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_id}/${assembly.id}/assembly.fa.gz.gzi`,
                            locationType: "UriLocation"
                        },
                    },
                },
            },
        ],
        tracks: [...annotations, ...mappings],
        defaultSession: {
            name: assembly.name + ' - default',
            margin: 0,
            views: [],
        },
    };
    return config;
};

export default generateConfig;
