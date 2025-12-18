import TopNavBar from '@/Components/TopNavBar';
import {Alert, Container} from "react-bootstrap";
import {useEffect, useState} from "react";
import TreeOfLife from "@/Components/TreeOfLife";

export default function Assemblies() {
    const [newick, setNewick] = useState(null);
    useEffect(() => {
        fetch("/life.txt")
            .then(res => res.text())
            .then(data => setNewick(data));
    }, []);
    return (
        <>
            <TopNavBar />
            <Container className="mt-1" style={{minHeight: "20vh"}}>
                {newick ? <TreeOfLife newick={newick}/> : "Loading..."}
            </Container>
        </>
    );
}
