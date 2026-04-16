import { ThemeConfiguration } from '@/Components/GenomeBrowser/config';

const generateConfig = (assembly, location_string = null) => {
    // Convert Annotations into JBrowse Tracks
    const annot_basename = 'sorted.gff3.gz';

    const my_annotations = assembly.genomic_annotations.filter((annot) => annot.name != 'Repeatmasker');
    const annotations = my_annotations.map((annotation) => {
        const fileBasename = 'sorted.gff3.gz';
        return {
            type: 'FeatureTrack',
            trackId: 'track_annotation_' + annotation.id,
            name: annotation.name,
            category: ['Annotations'],
            assemblyNames: [assembly.name],
            adapter: {
                type: 'Gff3TabixAdapter',
                gffGzLocation: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/annotations/${annotation.id}.${fileBasename}`,
                    locationType: 'UriLocation',
                },
                index: {
                    location: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/annotations/${annotation.id}.${fileBasename}.tbi`,
                        locationType: 'UriLocation',
                    },
                    indexType: 'TBI',
                },
            },
        };
    });

    const repeatmasker_annot = [
        {
            type: 'FeatureTrack',
            trackId: 'repeatmasker',
            name: 'Repeatmasker',
            category: ['Default Tracks'],
            assemblyNames: [assembly.name],
            adapter: {
                type: 'Gff3TabixAdapter',
                gffGzLocation: {
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/annotations/repeatmasker.${annot_basename}`,
                    locationType: 'UriLocation',
                },
                index: {
                    location: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/annotations/repeatmasker.${annot_basename}.tbi`,
                        locationType: 'UriLocation',
                    },
                    indexType: 'TBI',
                },
            },
            displays: [
                {
                    type: 'LinearBasicDisplay',
                    displayId: 'repeatmasker-LinearBasicDisplay',
                    mouseover: "jexl: join('<br/>',get(feature,'type'), '#' + get(feature,'id'))",
                    renderer: {
                        // This is a color brewer scheme -> https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
                        color1: "jexl: cast({ Simple_repeat: '#a65628', Low_complexity: '#999999', Unknown: '#ff7f00', rRNA: '#ffff33', DNA: '#e41a1c', LINE: '#f781bf', SINE: '#984ea3', LTR: '#377eb8' })[split(get(feature, 'type'), '/')[0]] ",
                        displayMode: 'collapse',
                        showLabels: false,
                    },
                },
            ],
        },
    ];

    // Convert Mappings into JBrowse Tracks
    const mappings = assembly.mappings.map((mapping) => {
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
                    uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/mappings/${mapping.id}.bam`,
                    locationType: 'UriLocation',
                },
                index: {
                    location: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/mappings/${mapping.id}.bam.bai`,
                        locationType: 'UriLocation',
                    },
                    indexType: 'BAI',
                },
                sequenceAdapter: {
                    type: 'BgzipFastaAdapter',
                    fastaLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz`,
                        locationType: 'UriLocation',
                    },
                    faiLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz.fai`,
                        locationType: 'UriLocation',
                    },
                    gziLocation: {
                        uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz.gzi`,
                        locationType: 'UriLocation',
                    },
                },
            },
            category: ['mapping'],
            assemblyNames: [assembly.name],
        };
    });

    const gc_track = {
        type: 'GCContentTrack',
        trackId: `${assembly.name}-GC`,
        assemblyNames: [assembly.name],
        name: 'GC-Content',

        adapter: {
            type: 'BgzipFastaAdapter',
            fastaLocation: {
                uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz`,
                locationType: 'UriLocation',
            },
            faiLocation: {
                uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz.fai`,
                locationType: 'UriLocation',
            },
            gziLocation: {
                uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz.gzi`,
                locationType: 'UriLocation',
            },
        },
    };

    const config = {
        assemblies: [
            {
                name: assembly.name.slice(0, 15) + '...',
                aliases: [assembly.name],
                sequence: {
                    type: 'ReferenceSequenceTrack',
                    trackId: `${assembly.name}-Sequence`,
                    adapter: {
                        type: 'BgzipFastaAdapter',
                        fastaLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz`,
                            locationType: 'UriLocation',
                        },
                        faiLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz.fai`,
                            locationType: 'UriLocation',
                        },
                        gziLocation: {
                            uri: `${import.meta.env.VITE_JBROWSE_ADRESS}/taxa/${assembly.taxon_ncbiTaxonID}/${assembly.id}/assembly.fa.gz.gzi`,
                            locationType: 'UriLocation',
                        },
                    },
                },
            },
        ],
        tracks: [gc_track, ...repeatmasker_annot, ...annotations, ...mappings],
        defaultSession: {
            name: assembly.name + ' - default',
            drawerPosition: 'right',
            margin: 0,
            views: [
                {
                    minimized: false,
                    type: 'LinearGenomeView',
                    bpPerPx: 156,
                    displayedRegions: [],
                    tracks: [
                        {
                            id: 'go3o6ho0mM7l7Er9lRI1M',
                            type: 'FeatureTrack',
                            configuration: 'repeatmasker',
                            minimized: false,
                            pinned: false,
                            displays: [
                                {
                                    id: 'nZpYE3hwBCR0vTiQAWq26',
                                    type: 'LinearBasicDisplay',
                                    configuration: 'repeatmasker-LinearBasicDisplay',
                                },
                            ],
                        },
                    ],
                    hideHeader: false,
                    hideHeaderOverview: false,
                    hideNoTracksActive: false,
                    trackSelectorType: 'hierarchical',
                    showCenterLine: false,
                    showCytobandsSetting: true,
                    trackLabels: '',
                    showGridlines: true,
                    highlight: [],
                    colorByCDS: false,
                    showTrackOutlines: true,
                    bookmarkHighlightsVisible: true,
                    bookmarkLabelsVisible: true,
                },
            ],
        },

        configuration: {
            theme: ThemeConfiguration,
        },
    };
    if (location_string) {
        const partials = location_string.split('|');
        partials[1] = parseInt(partials[1].replaceAll(',', ''));
        partials[2] = parseInt(partials[2].replaceAll(',', ''));

        const hit_track = {
            type: 'FeatureTrack',
            trackId: 'current_hit',
            name: 'Current Hit',
            category: ['custom'],
            assemblyNames: [assembly.name],
            adapter: {
                type: 'FromConfigAdapter',
                adapterId: 'fromurl',
                features: [
                    {
                        uniqueId: 'one',
                        refName: partials[0],
                        start: partials[1],
                        end: partials[2],
                        name: 'Selected Region',
                    },
                ],
            },
        };

        const view_config = {
            id: 'fromurl-view',
            type: 'FeatureTrack',
            configuration: 'current_hit',
            minimized: false,
            pinned: true,
            displays: [
                {
                    id: 'nZpYE3hwBCR0vTiQAWq26',
                    type: 'LinearBasicDisplay',
                    configuration: 'current_hit-LinearBasicDisplay',
                },
            ],
        };
        config.tracks.push(hit_track);
        config.defaultSession.views[0].tracks.push(view_config);
    }
    return config;
};

export default generateConfig;
