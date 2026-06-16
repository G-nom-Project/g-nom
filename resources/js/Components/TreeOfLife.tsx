// Based on the D3 example by Mike Bostock
import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

function parseNewick(a) {
    const e = [];
    let r = {};
    const s = a.split(/\s*(;|\(|\)|,|:)\s*/);
    let t = 0,
        n,
        c,
        h;

    for (; t < s.length; t++) {
        n = s[t];
        switch (n) {
            case '(':
                c = {};
                r.branchset = [c];
                e.push(r);
                r = c;
                break;
            case ',':
                c = {};
                e[e.length - 1].branchset.push(c);
                r = c;
                break;
            case ')':
                r = e.pop();
                break;
            case ':':
                break;
            default:
                h = s[t - 1];
                if (h === ')' || h === '(' || h === ',') {
                    r.name = n;
                } else if (h === ':') {
                    r.length = parseFloat(n);
                }
        }
    }
    return r;
}

function getAncestors(node) {
    const set = new Set();
    let cur = node;
    while (cur) {
        set.add(cur);
        cur = cur.parent;
    }
    return set;
}

const TreeOfLife = ({ newick, search_query, pass_query }) => {
    const ref = useRef();
    const nodesRef = useRef([]);
    const [query, setQuery] = useState('');

    const containerRef = useRef();

    const [width, setWidth] = useState(800);
    const [highlighted, setHighlighted] = useState(new Set());
    const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 });

    const RESET_ZOOM = {
        k: 1,
        x: 0,
        y: 0,
    };

    function searchTree(query) {
        if (!query) return [];
        const q = query.toLowerCase();
        return nodesRef.current.filter((d) => d.data.name?.toLowerCase().includes(q));
    }

    // Observer to fit window size at all times
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width);
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Build and render tree
    useEffect(() => {
        if (!newick) return;

        const data = parseNewick(newick);

        const size = Math.max(width, 400);
        const outerRadius = size / 2;
        const innerRadius = outerRadius * 0.5;

        const cluster = d3
            .cluster()
            .size([360, innerRadius])
            .separation(() => 1);

        function maxLength(d) {
            return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
        }

        function setRadius(d, y0, k) {
            d.radius = (y0 += d.data.length) * k;
            if (d.children) d.children.forEach((dd) => setRadius(dd, y0, k));
        }

        /**
        const color = d3.scaleOrdinal().domain(['Bacteria', 'Eukaryota', 'Archaea']).range(d3.schemeCategory10);
        function setColor(d) {
            const name = d.data.name;
            d.color = color.domain().includes(name) ? color(name) : d.parent ? d.parent.color : null;

            if (d.children) d.children.forEach(setColor);
        }
            **/

        function linkStep(a0, r0, a1, r1) {
            const c0 = Math.cos(((a0 - 90) * Math.PI) / 180);
            const s0 = Math.sin(((a0 - 90) * Math.PI) / 180);
            const c1 = Math.cos(((a1 - 90) * Math.PI) / 180);
            const s1 = Math.sin(((a1 - 90) * Math.PI) / 180);

            return (
                `M${r0 * c0},${r0 * s0}` + (a1 === a0 ? '' : `A${r0},${r0} 0 0 ${a1 > a0 ? 1 : 0} ${r0 * c1},${r0 * s1}`) + `L${r1 * c1},${r1 * s1}`
            );
        }

        d3.select(ref.current).selectAll('*').remove();

        const root = d3
            .hierarchy(data, (d) => d.branchset)
            .sum((d) => (d.branchset ? 0 : 1))
            .sort((a, b) => a.value - b.value || d3.ascending(a.data.length, b.data.length));

        // Bind leaves
        nodesRef.current = root.descendants();

        cluster(root);
        setRadius(root, (root.data.length = 0), innerRadius / maxLength(root));
        // setColor(root);

        const svg = d3
            .select(ref.current)
            .append('svg')
            .attr('viewBox', [-outerRadius, -outerRadius, size, size])
            .attr('width', '100%')
            .attr('height', 'auto')
            .style('display', 'block');

        // Use a zoom layer for animations
        const g = svg.append('g').attr('class', 'zoom-layer');

        // eslint-disable-next-line
        const links = g
            .append('g')
            .selectAll('path')
            .data(root.links())
            .join('path')
            .attr('fill', 'none')
            .attr('stroke', (d) => (highlighted.has(d.target) ? '#ff7a00' : '#ccc'))
            .attr('stroke-width', (d) => (highlighted.has(d.target) ? 2.5 : 1))
            .attr('d', (d) => linkStep(d.source.x, d.source.y, d.target.x, d.target.y));

        // eslint-disable-next-line
        const labels = g
            .append('g')
            .selectAll('text')
            .data(root.leaves())
            .join('text')
            .attr('dy', '.5em')
            .attr('transform', (d) => `rotate(${d.x - 90}) translate(${innerRadius + 4},0)` + (d.x < 180 ? '' : ' rotate(180)'))
            .attr('text-anchor', (d) => (d.x < 180 ? 'start' : 'end'))
            .text((d) => d.data.name)
            .style('cursor', 'pointer')
            .attr('fill', (d) => (highlighted.has(d) ? '#ff7a00' : '#333'))
            .style('font-weight', (d) => (highlighted.has(d) ? 700 : 400))
            .on('click', (event, d) => {
                event.stopPropagation();

                setHighlighted(getAncestors(d));
                setZoom(computeZoom(d, outerRadius));
            })
            .on('dblclick', (event) => {
                event.stopPropagation();

                setHighlighted(new Set());
                setZoom(RESET_ZOOM);
            });

        return () => {
            d3.select(ref.current).selectAll('*').remove();
        };
    }, [newick, width]);


    // Update Tree on highlight
    useEffect(() => {
        if (highlighted.size > 0) {
            let taxon_name = null;
            highlighted.values().forEach((each) => {
                if (each.height == 0) {
                    taxon_name = each.data.name
                }
            });
            pass_query(taxon_name);
        }


        const svg = d3.select(ref.current);

        svg.selectAll('path')
            .attr('stroke', (d) => (highlighted.has(d.target) ? '#ff7a00' : '#ccc'))
            .attr('stroke-width', (d) => (highlighted.has(d.target) ? 2.5 : 1));

        svg.selectAll('text')
            .attr('fill', (d) => (highlighted.has(d) ? '#ff7a00' : '#333'))
            .style('font-weight', (d) => (highlighted.has(d) ? 700 : 400));


    }, [highlighted]);


    useEffect(() => {
        d3.select(ref.current).select('.zoom-layer').transition().duration(750).attr('transform', `translate(${zoom.x},${zoom.y}) scale(${zoom.k})`);
    }, [zoom]);

    function computeZoom(d, outerRadius) {
        const angle = ((d.x - 90) * Math.PI) / 180;

        const tx = -Math.cos(angle) * d.y;
        const ty = -Math.sin(angle) * d.y;

        const k = Math.min(3.5, outerRadius / (d.y || 1));

        return {
            k,
            x: tx * k,
            y: ty * k,
        };
    }

    useEffect(() => {
        const t = setTimeout(() => {
        const svg = d3.select(ref.current);
        const matches = searchTree(query);
        const matchSet = new Set(matches);
        const highlightSet = new Set();

        matches.forEach((m) => {
            let cur = m;
            while (cur) {
                highlightSet.add(cur);
                cur = cur.parent;
            }
        });

        svg.selectAll('text')
            .attr('fill', (d) => (matchSet.has(d) ? 'red' : highlightSet.has(d) ? '#ff7a00' : '#333'))
            .style('font-weight', (d) => (matchSet.has(d) ? 900 : highlightSet.has(d) ? 600 : 400));
        }, 150);

        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        setQuery(search_query);
    }, [search_query]);

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <div ref={ref} />
        </div>
    );
};

export default TreeOfLife;
