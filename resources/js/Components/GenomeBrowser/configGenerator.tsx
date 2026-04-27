import { ThemeConfiguration } from '@/Components/GenomeBrowser/config';
import { Assembly } from '@/types/data';

const generateConfig = (assembly: Assembly, location_string: string | undefined) => {
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
        category: ['Default Tracks'],
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
            views: [],
        },
        configuration: {
            theme: ThemeConfiguration,
        },
    };
    if (location_string) {
        const partials = location_string.split('|');
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
                        start: parseInt(partials[1].replaceAll(',', '')),
                        end: parseInt(partials[2].replaceAll(',', '')),
                        name: 'Selected Region',
                    },
                ],
            },
        };
        config.tracks.push(hit_track);
    }
    return config;
};

export default generateConfig;
