import axios from 'axios';
import { useState } from 'react';
import TopNavBar from '@/Components/TopNavBar';
import { Button, Container, OverlayTrigger, Spinner, Table, Tooltip } from 'react-bootstrap';
import { sparql } from 'codemirror-lang-sparql';
import CodeMirror from '@uiw/react-codemirror';

const default_headers =
    'PREFIX gnom: <https://w3id.org/gnom/>\n' +
    'PREFIX biolink: <https://w3id.org/biolink/vocab/>\n' +
    'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
    'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>';

interface QleverStats {
    'num-subjects-normal': number;
    'num-objects-normal': number;
    'num-predicates-normal': number;
    'num-triples-normal': number;
}

interface QleverDatum {
    value: number | string;
    type: string;
}

interface QleverRow {
    [key: string]: QleverDatum;
}

interface QleverResultMeta {
    'result-size-total': number;
    'query-time-ms': number;
}

interface QleverResults {
    head: {vars: string[]};
    meta: QleverResultMeta;
    results: {bindings: QleverRow[]};
}

export default function SparqlPage({stats}:{stats: QleverStats}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<QleverResults | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Prettify known results i.e. IRI of entities constrained by the G-nom ontology. Returns React Node or the plain
     * string if no matching special category was found.
     * @param data string
     */
    const mapToSpecial = (data: string) => {
        if (data.match('^.*\\/assemblies\\/*')) {
            return data.split('/')[data.split('/').length - 1];
        } else if (data.match('^https://w3id.org/gnom/*')) {
            return (
                <>
                    <OverlayTrigger overlay={<Tooltip>This is linked resource from the G-nom Ontology.</Tooltip>}>
                        <img alt="gnom logo" src="/images/gnom.png" style={{ height: '1.25em' }} />
                    </OverlayTrigger>
                    {data.split('/')[data.split('/').length - 1]}
                </>
            );
        } else if (data.match('^http://www.wikidata.org/*')) {
            return (
                <>
                    {data.split('/')[data.split('/').length - 1]}
                </>
            );
        }
        return data;
    }

    async function execute() {
        setResults(null);
        setLoading(true);
        try {
            const response = await axios.post('/sparql/query', { query });
            setResults(response.data);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <TopNavBar />
            <Container fluid className="bg-light" style={{ minHeight: '100vh' }}>
                <h1 className="mt-3">
                    <a href="http://www.w3.org/2001/sw/">
                        <img src="/images/sw-cube-v.svg" className="inline-svg" alt="SW Cube"/>
                    </a>{' '}
                    Execute SPARQL Query
                </h1>
                <p>
                    This view is running in non-privileged mode and supports all read-only SPARQL operations. The data is stored in a QLever server
                    running locally on this G-nom instance. This database currently tracks{' '}
                    <b>{stats['num-subjects-normal'].toLocaleString('en-GB')}</b> subjects and{' '}
                    <b>{stats['num-objects-normal'].toLocaleString('en-GB')}</b> objects across{' '}
                    <b>{stats['num-predicates-normal'].toLocaleString('en-GB')}</b> predicates for a total of{' '}
                    <b>{stats['num-triples-normal'].toLocaleString('en-GB')}</b> triples composed of the NCBI Taxonomy and Data Objects stored by
                    G-nom. Default headers include <a href="https://www.w3.org/RDF/">rdf</a>, <a href="https://www.w3.org/TR/rdf-schema/">rdfs</a>,{' '}
                    <a href="https://biolink.github.io/biolink-model/">biolink</a>, and the G-nom ontology as well as their dependencies.
                </p>
                <CodeMirror value={query} height="400px" extensions={[sparql()]} onChange={setQuery} />
                <Button className="mt-2" onClick={() => setQuery(default_headers + '\n' + query)}>
                    <i className="bi bi-braces-asterisk"></i> Insert default Headers
                </Button>{' '}
                <Button className="mt-2" onClick={execute} disabled={loading}>
                    {(loading && <Spinner animation="border" size="sm" />) || <i className="bi bi-lightning-charge-fill"></i>} Execute Query
                </Button>
                <hr />
                {results && (
                    <>
                        <p>
                            Found <b>{results.meta['result-size-total']}</b> results in <b>{results.meta['query-time-ms']}</b> ms.
                        </p>
                        <Table striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    {results.head.vars.map((each: string) => {
                                        return <th key={each}>{each}</th>;
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {results.results.bindings.map((row: QleverRow, rowIndex: number) => (
                                    <tr key={rowIndex}>
                                        {results.head.vars.map(
                                            (col: string) =>
                                                (row[col].type === 'uri' && (
                                                    <td key={col}>
                                                        <a href={row[col]?.value as string}>{mapToSpecial(row[col]?.value as string) ?? ''}</a>
                                                    </td>
                                                )) || <td key={col}>{row[col]?.value ?? ''}</td>,
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
            </Container>
        </>
    );
}
