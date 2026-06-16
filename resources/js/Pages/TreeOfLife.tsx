import TopNavBar from '@/Components/TopNavBar';
import React, { useEffect, useState } from 'react';
import TreeOfLife from '@/Components/TreeOfLife';
import { Alert, Col, Container, Form, Row } from 'react-bootstrap';
import { Taxon } from '@/types/data';
import RichTaxonCard from '@/Components/RichTaxonCard';

export default function Assemblies({newick_tree}: {newick_tree: string}) {
    const [query, setQuery] = useState('');
    const [treeQuery, setTreeQuery] = useState<string|null>(null);
    const [taxon, setTaxon] = useState<Taxon|null>(null);

    const bindTreeSelection = (selection: string) => {
        setTreeQuery(selection);
    }

    useEffect(() => {
        if (treeQuery) {
            axios
                .post('/taxon-by-name', {
                    taxon_name: treeQuery,
                })
                .then((res) => setTaxon(res.data.taxon));
        }
    }, [treeQuery]);

    return (
        <>
            <TopNavBar />
            <Container fluid>
                <Row>
                    <Col xs={4}>
                        <Form className="m-3 mt-5" style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
                            <Form.Control placeholder={'Search Taxa'} onChange={(e) => setQuery(e.target.value)}></Form.Control>
                        </Form>
                        <Alert className="m-3" style={{ width: '100%' }}>
                            Enter a search query above to highlight matching taxa in the tree. Click on any taxa on the tree to see available
                            assemblies.
                        </Alert>
                        {taxon && (
                            <RichTaxonCard taxon={taxon}/>
                        )}
                    </Col>
                    <Col>{newick_tree.length > 0 && <TreeOfLife newick={newick_tree} search_query={query} pass_query={bindTreeSelection} />}</Col>
                </Row>
            </Container>
        </>
    );
}
