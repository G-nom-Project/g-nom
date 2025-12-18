// TreeOfLife.js
// Based off the d3 example by Mike Bostock
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card } from "react-bootstrap";

function parseNewick(a) {
    const e = [];
    let r = {};
    const s = a.split(/\s*(;|\(|\)|,|:)\s*/);
    let t = 0, n, c, h;

    for (; t < s.length; t++) {
        n = s[t];
        switch (n) {
            case "(":
                c = {};
                r.branchset = [c];
                e.push(r);
                r = c;
                break;
            case ",":
                c = {};
                e[e.length - 1].branchset.push(c);
                r = c;
                break;
            case ")":
                r = e.pop();
                break;
            case ":":
                break;
            default:
                h = s[t - 1];
                if (h === ")" || h === "(" || h === ",") {
                    r.name = n;
                } else if (h === ":") {
                    r.length = parseFloat(n);
                }
        }
    }
    return r;
}


const TreeOfLife = ({ newick, width = 954 }) => {
    const ref = useRef();

    useEffect(() => {
        if (!newick) return;

        const data = parseNewick(newick);
        const outerRadius = width / 2;
        const innerRadius = outerRadius - 170;

        const cluster = d3.cluster().size([360, innerRadius]).separation(() => 1);

        function maxLength(d) {
            return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
        }

        function setRadius(d, y0, k) {
            d.radius = (y0 += d.data.length) * k;
            if (d.children) d.children.forEach(dd => setRadius(dd, y0, k));
        }

        const color = d3
            .scaleOrdinal()
            .domain(["Bacteria", "Eukaryota", "Archaea"])
            .range(d3.schemeCategory10);

        function setColor(d) {
            const name = d.data.name;
            d.color = color.domain().includes(name)
                ? color(name)
                : d.parent
                    ? d.parent.color
                    : null;
            if (d.children) d.children.forEach(setColor);
        }

        function linkStep(startAngle, startRadius, endAngle, endRadius) {
            const c0 = Math.cos(((startAngle - 90) / 180) * Math.PI);
            const s0 = Math.sin(((startAngle - 90) / 180) * Math.PI);
            const c1 = Math.cos(((endAngle - 90) / 180) * Math.PI);
            const s1 = Math.sin(((endAngle - 90) / 180) * Math.PI);
            return (
                "M" +
                startRadius * c0 +
                "," +
                startRadius * s0 +
                (endAngle === startAngle
                    ? ""
                    : "A" +
                    startRadius +
                    "," +
                    startRadius +
                    " 0 0 " +
                    (endAngle > startAngle ? 1 : 0) +
                    " " +
                    startRadius * c1 +
                    "," +
                    startRadius * s1) +
                "L" +
                endRadius * c1 +
                "," +
                endRadius * s1
            );
        }

        // clear any previous render
        d3.select(ref.current).selectAll("*").remove();

        const root = d3
            .hierarchy(data, d => d.branchset)
            .sum(d => (d.branchset ? 0 : 1))
            .sort(
                (a, b) =>
                    a.value - b.value || d3.ascending(a.data.length, b.data.length)
            );

        cluster(root);
        setRadius(root, (root.data.length = 0), innerRadius / maxLength(root));
        setColor(root);

        const svg = d3
            .select(ref.current)
            .append("svg")
            .attr("viewBox", [-outerRadius, -outerRadius, width, width])
            .attr("font-family", "sans-serif")
            .attr("font-size", 10);

        const link = svg
            .append("g")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d =>
                linkStep(d.source.x, d.source.y, d.target.x, d.target.y)
            )
            .attr("stroke", d => d.target.color);

        svg
            .append("g")
            .selectAll("text")
            .data(root.leaves())
            .join("text")
            .attr("dy", ".31em")
            .attr(
                "transform",
                d =>
                    `rotate(${d.x - 90}) translate(${innerRadius + 4},0)${
                        d.x < 180 ? "" : " rotate(180)"
                    }`
            )
            .attr("text-anchor", d => (d.x < 180 ? "start" : "end"))
            .text(d => d.data.name.replace(/_/g, " "));

        return () => {
            d3.select(ref.current).selectAll("*").remove();
        };
    }, [newick, width]);

    return (
        <Card className="shadow-sm">
            <Card.Header>Tree of Life</Card.Header>
            <Card.Body>
                <div ref={ref} />
            </Card.Body>
        </Card>
    );
};

export default TreeOfLife;
