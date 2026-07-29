/**
 * The code is this file is an adaptation of the original snail plot by Richard Challis. The original source may be found
 * here: https://doi.org/10.5281/zenodo.322347
 *
 * The following modifications were made by Lucas Koch:
 * - ported to d3 v7
 * - Fixed path generation for modern D3 line generators
 * - Removed jQuery idioms for use with React
 * - disabled scale dials (for now)
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015-2016 Richard Challis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


import * as d3 from 'd3';

/**
 * Simple value extraction function, intended to replace the $ idiom in the original code
 * @param obj
 * @returns {*[]}
 */
function values(obj) {
    return Object.keys(obj)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => obj[key]);
}


export class Assembly {
    constructor(stats, scaffolds, contigs) {
        let lsum;
        this.scaffolds = scaffolds ? scaffolds : stats.scaffolds;
        this.contigs = contigs ? contigs : stats.contigs;
        this.scaffold_count = stats.scaffold_count ? stats.scaffold_count : stats.scaffolds.length;
        this.genome = stats.genome;
        this.assembly = stats.assembly;
        this.N = stats.N ? (stats.N <= 100 ? (stats.N < 1 ? stats.N * 100 : stats.N) : (stats.N / this.assembly) * 100) : 0;
        this.ATGC = stats.ATGC
            ? stats.ATGC <= 100
                ? stats.ATGC <= 1
                    ? stats.ATGC * 100
                    : stats.ATGC
                : (stats.ATGC / this.assembly) * 100
            : 100 - this.N;
        this.GC = stats.GC ? (stats.GC <= 100 ? (stats.GC <= 1 ? stats.GC * 100 : stats.GC) : (stats.GC / this.assembly) * 100) : 0;
        this.contig_sum = this.assembly - (this.assembly * this.N) / 100;
        this.cegma_complete = stats.cegma_complete;
        this.cegma_partial = stats.cegma_partial;
        this.busco = stats.busco;
        this.scaffolds = stats.scaffolds.sort(function (a, b) {
            return b - a;
        });
        let npct_length = {};
        let npct_count = {};
        this.GCs = stats.GCs ? stats.GCs : stats.binned_GCs;
        this.Ns = stats.Ns ? stats.Ns : stats.binned_Ns;

        if (stats.binned_scaffold_lengths) {
            this.npct_length = stats.binned_scaffold_lengths;
            this.npct_count = stats.binned_scaffold_counts;
            if (stats.binned_contig_lengths) {
                this.nctg_length = stats.binned_contig_lengths;
                this.nctg_count = stats.binned_contig_counts;
                this.contig_count = stats.contig_count;
            }
        } else {
            const sum = stats.scaffolds.reduce(function (previousValue, currentValue) {
                return previousValue + currentValue;
            });
            if (stats.contigs) {
                var ctgsum = stats.contigs.reduce(function (previousValue, currentValue) {
                    return previousValue + currentValue;
                });
            }
            lsum = 0;
            this.scaffolds.forEach(function (length, index) {
                const new_sum = lsum + length;
                if (Math.floor((new_sum / sum) * 1000) > Math.floor((lsum / sum) * 100)) {
                    npct_length[Math.floor((new_sum / sum) * 1000)] = length;
                    npct_count[Math.floor((new_sum / sum) * 1000)] = index + 1;
                }
                lsum = new_sum;
            });
            this.seq = Array.apply(0, Array(1000)).map(function (x, y) {
                return 1000 - y;
            });
            this.seq.forEach(function (i, _) {
                if (!npct_length[i]) npct_length[i] = npct_length[i + 1];
                if (!npct_count[i]) npct_count[i] = npct_count[i + 1];
            });
            this.npct_length = values(npct_length);
            this.npct_count = values(npct_count);

            const nctg_length = {};
            const nctg_count = {};

            if (stats.contigs) {
                this.contigs = stats.contigs.sort(function (a, b) {
                    return b - a;
                });

                lsum = 0;
                this.contigs.forEach(function (length, index, _) {
                    const new_sum = lsum + length;
                    if (Math.floor((new_sum / ctgsum) * 1000) > Math.floor((lsum / ctgsum) * 100)) {
                        nctg_length[Math.floor((new_sum / ctgsum) * 1000)] = length;
                        nctg_count[Math.floor((new_sum / ctgsum) * 1000)] = index + 1;
                    }
                    lsum = new_sum;
                });
                this.seq.forEach(function (i, _) {
                    if (!nctg_length[i]) nctg_length[i] = nctg_length[i + 1];
                    if (!nctg_count[i]) nctg_count[i] = nctg_count[i + 1];
                });
                this.nctg_length = values(nctg_length);
                this.nctg_count = values(nctg_count);
                this.contig_count = stats.contigs.length;
            }
        }
        this.scale = {};
        this.setScale('percent', 'linear', [0, 100], [180 * (Math.PI / 180), 90 * (Math.PI / 180)]);
        this.setScale('100percent', 'linear', [0, 100], [0, 2 * Math.PI]);
        this.setScale('gc', 'linear', [0, 100], [0, 100]); // range will be updated when drawing
        this.setScale('count', 'log', [1, 1e6], [100, 1]); // range will be updated when drawing
        this.setScale('length', 'sqrt', [1, 1e6], [1, 100]); // range will be updated range when drawing
    }

    /**
     * Helper function to scale d3 elements
     * @param element d3 element
     * @param scaling shorthand for scale, may be log or sqrt, default linear
     * @param domain
     * @param range
     */
    setScale(element, scaling, domain, range) {
        this.scale[element] = scaling === 'log' ? d3.scaleLog() : scaling === 'sqrt' ? d3.scaleSqrt() : d3.scaleLinear();
        this.scale[element].domain(domain);
        this.scale[element].range(range);
    }
    drawPlot(parent_div, longest, circle_span) {
        let GCs;
        let Ns;
        let ccg;
        let ccag;
        let ccdg;
        let line;
        let revline;
        let lccg;
        let txt;
        let key;
        // setup plot dimensions
        const size = 600;
        const margin = 100;
        const tick = 10;
        const w = 12; // coloured box size for legend

        const parent = d3.select('#' + parent_div);
        const svg = parent.append('svg');

        svg.attr('width', '80%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 ' + size + ' ' + size)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // setup radii for circular plots
        let radii = {};
        radii.core = [0, (size - margin * 2 - tick * 2) / 2];
        radii.core.majorTick = [radii.core[1], radii.core[1] + tick];
        radii.core.minorTick = [radii.core[1], radii.core[1] + tick / 2];
        radii.percent = [radii.core[1] + tick * 4, radii.core[1]];
        radii.percent.majorTick = [radii.percent[0], radii.percent[0] - tick];
        radii.percent.minorTick = [radii.percent[0], radii.percent[0] - tick / 2];
        radii.genome = [0, tick * 3];
        radii.ceg = [0, tick * 2, tick * 4];
        radii.ceg.majorTick = [radii.ceg[2], radii.ceg[2] + tick / 1.5];
        radii.ceg.minorTick = [radii.ceg[2], radii.ceg[2] + tick / 3];

        // adjust scales for plot dimensions/data
        if (!longest) longest = this.scaffolds[0] + 1;
        if (longest <= this.scaffolds[0]) longest = this.scaffolds[0] + 1;
        if (!circle_span) circle_span = this.assembly;
        if (circle_span < this.assembly) circle_span = this.assembly;
        this.scale['length'].domain([1, longest]);
        this.scale['length'].range([radii.core[0], radii.core[1]]);
        this.scale['count'].range([radii.core[1], radii.core[0] + radii.core[1] / 3]);
        this.scale['percent'].range([0, (2 * Math.PI * this.assembly) / circle_span]);
        this.scale['gc'].range([radii.percent[1], radii.percent[0]]);

        const lScale = this.scale['length'];
        const cScale = this.scale['count'];
        const pScale = this.scale['percent'];
        const p100Scale = this.scale['100percent'];
        const gScale = this.scale['gc'];
        const npct_length = this.npct_length;
        const npct_count = this.npct_count;
        const nctg_count = this.nctg_count;
        const scaffolds = this.scaffolds;


        // create a group for the plot
        const g = svg
            .append('g')
            .attr('transform', 'translate(' + size / 2 + ',' + size / 2 + ')')
            .attr('id', 'asm-g-plot');

        // draw base composition axis fill
        const bcg = g.append('g').attr('id', 'asm-g-base_composition');
        const bcdg = bcg.append('g').attr('id', 'asm-g-base_composition_data');
        const n = 100 - this.ATGC;
        const gc_start = (n / 100) * this.GC;
        if (this.GCs && this.Ns) {
            plot_arc(bcdg, radii.percent[0], radii.percent[1], pScale(0), pScale(100), 'asm-ns');
            const lower = [];
            const upper = [];
            GCs = this.GCs;
            Ns = this.Ns;
            let GCs_min;
            let GCs_max;
            if (Object.prototype.hasOwnProperty.call(Ns[0], 'mean')) {
                Ns = Ns.map(function (d) {
                    return d.mean;
                });
                GCs_min = this.GCs.map(function (d) {
                    return d.min;
                });
                GCs_max = this.GCs.map(function (d) {
                    return d.max;
                });
                GCs = this.GCs.map(function (d) {
                    return d.mean;
                });
            }
            Ns.forEach(function (current, i) {
                lower.push(0);
                upper.push(100 - current + lower[i]);
            });
            // forwards...
            line = d3
                .line()
                .x(function (d, i) {
                    return Math.cos(pScale(i / 10) - Math.PI / 2) * gScale(d);
                })
                .y(function (d, i) {
                    return Math.sin(pScale(i / 10) - Math.PI / 2) * gScale(d);
                });
            // ... and backwards
            revline = d3
                .line()
                .x(function (d, i) {
                    return Math.cos(pScale((1000 - i) / 10) - Math.PI / 2) * gScale(d);
                })
                .y(function (d, i) {
                    return Math.sin(pScale((1000 - i) / 10) - Math.PI / 2) * gScale(d);
                });

            const atgc = line([0]).replace('Z', '') + line(lower).replace(/^M/, 'L') + revline([...upper].reverse()).replace(/^M/, 'L');
            bcdg.append('path').attr('class', 'asm-atgc').attr('d', atgc).attr('fill-rule', 'evenodd');
            const gc = line([0]).replace('Z', '') + line(lower).replace(/^M/, 'L') + revline([...GCs].reverse()).replace(/^M/, 'L');

            bcdg.append('path').attr('class', 'asm-gc').attr('d', gc).attr('fill-rule', 'evenodd');
            if (GCs_min) {
                const gc_min = revline(GCs_min.reverse());
                bcdg.append('path').attr('class', 'asm-atgc-line').attr('d', gc_min);
                const gc_max = revline(GCs_max.reverse());
                bcdg.append('path').attr('class', 'asm-gc-line').attr('d', gc_max);
            }
        } else {
            plot_arc(bcdg, radii.percent[0], radii.percent[1], pScale(0), pScale(100), 'asm-ns');
            plot_arc(bcdg, radii.percent[0], radii.percent[1], pScale(gc_start), pScale(gc_start + this.ATGC), 'asm-atgc');
            plot_arc(bcdg, radii.percent[0], radii.percent[1], pScale(gc_start), pScale(this.GC), 'asm-gc');
        }
        const bcag = bcg.append('g').attr('id', 'asm-g-base_composition_axis');
        percent_axis(bcag, radii, pScale);

        // plot BUSCO/CEGMA completeness if available
        if (this.busco) {
            ccg = g
                .append('g')
                .attr('transform', 'translate(' + (radii.percent[1] + tick * 3.5) + ',' + (-radii.percent[1] - tick * 0) + ')')
                .attr('id', 'asm-busco_completeness');
            ccdg = ccg.append('g').attr('id', 'asm-busco_completeness_data');
            plot_arc(ccdg, radii.ceg[1] / 1.5, radii.ceg[2], p100Scale(this.busco.C), p100Scale(this.busco.C + this.busco.F), 'asm-busco_F');
            plot_arc(ccdg, radii.ceg[1] / 1.5, radii.ceg[2], p100Scale(0), p100Scale(this.busco.C), 'asm-busco_C');
            plot_arc(ccdg, radii.ceg[1] / 1.5, radii.ceg[2], p100Scale(0), p100Scale(this.busco.D), 'asm-busco_D');
            ccag = ccg.append('g').attr('id', 'asm-busco_completeness_axis');
            ccag.append('circle')
                .attr('r', radii.ceg[1] / 1.5)
                .attr('class', 'asm-axis');
            ccag.append('line')
                .attr('y1', -radii.ceg[1] / 1.5)
                .attr('y2', -radii.ceg[2])
                .attr('class', 'asm-axis');
            cegma_axis(ccag, radii, p100Scale);
        } else if (this.cegma_complete) {
            ccg = g
                .append('g')
                .attr('transform', 'translate(' + (radii.percent[1] + tick * 3) + ',' + (-radii.percent[1] - tick * 2) + ')')
                .attr('id', 'asm-cegma_completeness');
            ccdg = ccg.append('g').attr('id', 'asm-cegma_completeness_data');
            plot_arc(ccdg, radii.ceg[0], radii.ceg[1], p100Scale(0), p100Scale(this.cegma_complete), 'asm-ceg_comp');
            plot_arc(ccdg, radii.ceg[1], radii.ceg[2], p100Scale(0), p100Scale(this.cegma_partial), 'asm-ceg_part');
            ccag = ccg.append('g').attr('id', 'asm-cegma_completeness_axis');
            ccag.append('circle').attr('r', radii.ceg[1]).attr('class', 'asm-ceg_line');
            ccag.append('line').attr('y2', -radii.ceg[2]).attr('class', 'asm-axis');
            cegma_axis(ccag, radii, p100Scale);
        }

        line = d3
            .line()
            .x(function (d, i) {
                return Math.cos(pScale(i / 10) - Math.PI / 2) * (radii.core[1] - cScale(d));
            })
            .y(function (d, i) {
                return Math.sin(pScale(i / 10) - Math.PI / 2) * (radii.core[1] - cScale(d));
            });

        //plot contig count data if available
        if (this.contigs) {
            const ctcg = g.append('g').attr('id', 'asm-g-contig_count');
            const ctcdg = ctcg.append('g').attr('id', 'asm-g-contig_count_data');
            const ctg_counts = values(nctg_count);
            ctcdg.append('path').datum(ctg_counts).attr('class', 'asm-contig_count asm-remote').attr('d', line);
        }
        //plot scaffold count data
        const scg = g.append('g').attr('id', 'asm-g-scaffold_count');
        const scdg = scg.append('g').attr('id', 'asm-g-scaffold_count_data');
        const scaf_counts = values(this.npct_count);
        scdg.append('path').datum(scaf_counts).attr('class', 'asm-count asm-remote').attr('d', line);

        // plot scaffold lengths
        const slg = g.append('g').attr('id', 'asm-g-scaffold_length');
        const sldg = slg.append('g').attr('id', 'asm-g-scaffold_length_data');

        line = d3
            .line()
            .x(function (d, i) {
                return Math.cos(pScale(i / 10) - Math.PI / 2) * (radii.core[1] - lScale(d));
            })
            .y(function (d, i) {
                return Math.sin(pScale(i / 10) - Math.PI / 2) * (radii.core[1] - lScale(d));
            });
        revline = d3
            .line()
            .x(function (d, i) {
                return Math.cos(pScale((1000 - i) / 10) - Math.PI / 2) * (radii.core[1] - lScale(d));
            })
            .y(function (d, i) {
                return Math.sin(pScale((1000 - i) / 10) - Math.PI / 2) * (radii.core[1] - lScale(d));
            });
        const scaf_lengths = values(this.npct_length);

        const zeros = Array.apply(0, Array(1000)).map(function (x, y) {
            return 0;
        });
        let hollow = line([0]).replace('Z', '') + line(scaf_lengths).replace(/^M/, 'L') + revline([...zeros].reverse()).replace(/^M/, 'L');

        sldg.append('path').attr('class', 'asm-pie').attr('d', hollow).attr('fill-rule', 'evenodd');

        // plot contig lengths if available
        if (this.contigs) {
            var ctg_lengths = values(this.nctg_length);
            hollow = line([0]).replace('Z', '') + line(ctg_lengths).replace(/^M/, 'L') + revline([...zeros].reverse()).replace(/^M/, 'L');
            sldg.append('path').attr('class', 'asm-contig').attr('d', hollow).attr('fill-rule', 'evenodd');
        }
        // highlight n50, n90 and longest scaffold
        const slhg = slg.append('g').attr('id', 'asm-g-scaffold_length_highlight');
        const long_pct = (scaffolds[0] / this.assembly) * 100;
        if (long_pct >= 0.1) {
            plot_arc(slhg, radii.core[1] - lScale(scaffolds[0]), radii.core[1], 0, pScale(long_pct), 'asm-longest_pie');
        }
        plot_arc(slhg, radii.core[1] - lScale(this.npct_length[500]), radii.core[1], 0, pScale(50), 'asm-n50_pie');
        plot_arc(slhg, radii.core[1] - lScale(this.npct_length[900]), radii.core[1], 0, pScale(90), 'asm-n90_pie');
        plot_arc(slhg, radii.core[1] - lScale(this.npct_length[500]), radii.core[1], pScale(50), pScale(50), 'asm-n50_pie asm-highlight');
        if (long_pct >= 0.1) {
            plot_arc(slhg, radii.core[1] - lScale(scaffolds[0]), radii.core[1], pScale(long_pct), pScale(long_pct), 'asm-longest_pie asm-highlight');
        }

        // add gridlines at powers of 10
        const length_seq = [];
        let power = 2;
        while (Math.pow(10, power) <= longest) {
            length_seq.push(power);
            power++;
        }
        const slgg = slg.append('g').attr('id', 'asm-g-scaffold_length_gridlines');
        length_seq.forEach(function (i, _) {
            //if(Math.pow(10,i+4) > longest && Math.pow(10,i+1) > npct_length[1000]){
            if (Math.pow(10, i + 4) >= longest && Math.pow(10, i + 1) > npct_length[900] && Math.pow(10, i) < npct_length[100]) {
                //plot_arc(slgg,radii.core[1]-lScale(Math.pow(10,i)),radii.core[1]-lScale(Math.pow(10,i)),pScale(0),pScale(100),'asm-length_axis asm-dashed');
                slgg.append('circle')
                    .attr('r', radii.core[1] - lScale(Math.pow(10, i)))
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('stroke-dasharray', '10,10')
                    .attr('class', 'asm-length_axis');
            }
        });

        // plot scaffold/contig count gridlines
        if (!this.contigs) {
            const scgg = scg.append('g').attr('id', 'asm-g-scaffold_count_gridlines');
            [1, 2, 3, 4, 5, 6, 7].forEach(function (i, _) {
                scgg.append('circle')
                    .attr('class', 'asm-count_axis')
                    .attr('r', radii.core[1] - cScale(Math.pow(10, i)));
            });
        } else {
            const ctcgg = scg.append('g').attr('id', 'asm-g-contig_count_gridlines');
            [1, 2, 3, 4, 5, 6, 7].forEach(function (i, _) {
                ctcgg
                    .append('circle')
                    .attr('class', 'asm-count_axis')
                    .attr('r', radii.core[1] - cScale(Math.pow(10, i)));
            });
        }

        // plot radial axis
        const mag = g.append('g').attr('id', 'asm-g-main_axis');
        const slag = g.append('g').attr('id', 'asm-g-scaffold_length_axis');

        length_seq.forEach(function (i, _) {
            if (Math.pow(10, i + 4) >= longest && Math.pow(10, i + 1) > npct_length[900] && Math.pow(10, i) < npct_length[100]) {
                slag.append('text')
                    .attr('transform', 'translate(' + (Math.pow(1.5, i) + 2) + ',' + (-radii.core[1] + lScale(Math.pow(10, i)) + 4) + ')')
                    .text(getReadableSeqSizeString(Math.pow(10, i), 0))
                    .attr('class', 'text-asm asm-length_label');
            }
            slag.append('line')
                .attr('x1', 0)
                .attr('y1', -radii.core[1] + lScale(Math.pow(10, i)))
                .attr('x2', Math.pow(1.5, i))
                .attr('y2', -radii.core[1] + lScale(Math.pow(10, i)))
                .attr('class', 'asm-majorTick');
        });
        slag.append('line').attr('class', 'asm-length asm-axis').attr('x1', 0).attr('y1', -radii.core[1]).attr('x2', 0).attr('y2', 0);

        // draw circumferential axis
        circumference_axis(mag, radii, pScale);

        // draw legends
        const lg = g.append('g').attr('id', 'asm-g-legend');

        // draw BUSCO/CEGMA legend
        if (this.busco) {
            lccg = lg.append('g').attr('id', 'asm-g-busco_completeness_legend');
            txt = lccg
                .append('text')
                .attr('transform', 'translate(' + (size / 2 - 210) + ',' + (-size / 2 + 20) + ')')
                .attr('class', 'asm-tr_title');
            txt.append('tspan').text('BUSCO (n = ' + this.busco.n.toLocaleString() + ')');
            key = lccg.append('g').attr('transform', 'translate(' + (size / 2 - 210) + ',' + (-size / 2 + 28) + ')');
            key.append('rect').attr('height', w).attr('width', w).attr('class', 'asm-busco_C asm-toggle');
            key.append('text')
                .attr('x', w + 3)
                .attr('y', w - 1)
                .text('Comp. (' + this.busco.C.toFixed(1) + '%)')
                .attr('class', 'asm-key');
            key.append('rect')
                .attr('y', w * 1.5)
                .attr('height', w)
                .attr('width', w)
                .attr('class', 'asm-busco_D asm-toggle');
            key.append('text')
                .attr('x', w + 3)
                .attr('y', w * 2.5 - 1)
                .text('Dup. (' + this.busco.D.toFixed(1) + '%)')
                .attr('class', 'asm-key');
            key.append('rect')
                .attr('y', w * 3)
                .attr('height', w)
                .attr('width', w)
                .attr('class', 'asm-busco_F asm-toggle');
            key.append('text')
                .attr('x', w + 3)
                .attr('y', w * 4 - 1)
                .text('Frag. (' + this.busco.F.toFixed(1) + '%)')
                .attr('class', 'asm-key');
        } else if (this.cegma_complete) {
            lccg = lg.append('g').attr('id', 'asm-g-cegma_completeness_legend');
            txt = lccg
                .append('text')
                .attr('transform', 'translate(' + (size / 2 - 230) + ',' + (-size / 2 + 20) + ')')
                .attr('class', 'asm-tr_title');
            txt.append('tspan').text('CEGMA completeness');
            key = lccg.append('g').attr('transform', 'translate(' + (size / 2 - 230) + ',' + (-size / 2 + 28) + ')');
            key.append('rect').attr('height', w).attr('width', w).attr('class', 'asm-ceg_comp asm-toggle');
            key.append('text')
                .attr('x', w + 3)
                .attr('y', w - 1)
                .text('Complete (' + this.cegma_complete.toFixed(1) + '%)')
                .attr('class', 'asm-key');
            key.append('rect')
                .attr('y', w * 1.5)
                .attr('height', w)
                .attr('width', w)
                .attr('class', 'asm-ceg_part asm-toggle');
            key.append('text')
                .attr('x', w + 3)
                .attr('y', w * 2.5 - 1)
                .text('Partial (' + this.cegma_partial.toFixed(1) + '%)')
                .attr('class', 'asm-key');
        }

        //draw base composition legend
        const lbcg = lg.append('g').attr('id', 'asm-g-base_composition_legend');
        txt = lbcg
            .append('text')
            .attr('transform', 'translate(' + (size / 2 - 140) + ',' + (size / 2 - 110) + ')')
            .attr('class', 'asm-br_title');
        txt.append('tspan').text('Assembly');
        txt.append('tspan').text('base composition').attr('x', 0).attr('dy', 18);
        key = lbcg.append('g').attr('transform', 'translate(' + (size / 2 - 140) + ',' + (size / 2 - 83) + ')');
        var at_text = 'AT (' + (this.ATGC - this.GC).toFixed(1) + '%)';
        var gc_text = 'GC (' + this.GC.toFixed(1) + '%)';
        var n_text = 'N (' + n.toFixed(1) + '%)';
        key.append('rect').attr('height', w).attr('width', w).attr('class', 'asm-gc asm-toggle');
        key.append('text')
            .attr('x', w + 2)
            .attr('y', w - 1)
            .text(gc_text)
            .attr('class', 'asm-key')
            .attr('id', 'asm-gc_value');
        key.append('rect')
            .attr('y', w * 1.5)
            .attr('height', w)
            .attr('width', w)
            .attr('class', 'asm-atgc asm-toggle');
        key.append('text')
            .attr('x', w + 2)
            .attr('y', w * 2.5 - 1)
            .text(at_text)
            .attr('class', 'asm-key')
            .attr('id', 'asm-at_value');
        key.append('rect')
            .attr('y', w * 3)
            .attr('height', w)
            .attr('width', w)
            .attr('class', 'asm-ns asm-toggle');
        key.append('text')
            .attr('x', w + 2)
            .attr('y', w * 4 - 1)
            .text(n_text)
            .attr('class', 'asm-key')
            .attr('id', 'asm-n_value');

        //draw scaffold legend
        const lsg = lg.append('g').attr('id', 'asm-g-scaffold_legend');
        txt = lsg
            .append('text')
            .attr('transform', 'translate(' + (-size / 2 + 10) + ',' + (-size / 2 + 20) + ')')
            .attr('class', 'asm-tl_title');
        txt.append('tspan').text('Scaffold statistics');
        //txt.append('tspan').text('distribution').attr('x',0).attr('dy',20);
        key = lsg.append('g').attr('transform', 'translate(' + (-size / 2 + 10) + ',' + (-size / 2 + 28) + ')');
        key.append('rect').attr('height', w).attr('width', w).attr('class', 'asm-count asm-toggle');
        let count_txt = key
            .append('text')
            .attr('x', w + 3)
            .attr('y', w - 1)
            .attr('class', 'asm-key');
        count_txt.append('tspan').text('Log');
        count_txt.append('tspan').attr('baseline-shift', 'sub').attr('font-size', '75%').text(10);
        count_txt.append('tspan').text(' scaffold count (total ' + this.scaffold_count.toLocaleString() + ')');
        key.append('rect')
            .attr('y', w * 1.5)
            .attr('height', w)
            .attr('width', w)
            .attr('class', 'asm-pie asm-toggle');
        key.append('text')
            .attr('x', w + 3)
            .attr('y', w * 2.5 - 1)
            .text('Scaffold length (total ' + getReadableSeqSizeString(this.assembly, 0) + ')')
            .attr('class', 'asm-key');

        key.append('rect')
            .attr('y', w * 3)
            .attr('height', w)
            .attr('width', w)
            .attr('class', 'asm-longest_pie asm-toggle');
        key.append('text')
            .attr('x', w + 3)
            .attr('y', w * 4 - 1)
            .text('Longest scaffold (' + getReadableSeqSizeString(this.scaffolds[0]) + ')')
            .attr('class', 'asm-key');
        key.append('rect')
            .attr('y', w * 4.5)
            .attr('height', w)
            .attr('width', w)
            .attr('class', 'asm-n50_pie asm-toggle');
        key.append('text')
            .attr('x', w + 3)
            .attr('y', w * 5.5 - 1)
            .text('N50 length (' + getReadableSeqSizeString(this.npct_length[499]) + ')')
            .attr('class', 'asm-key');
        key.append('rect')
            .attr('y', w * 6)
            .attr('height', w)
            .attr('width', w)
            .attr('class', 'asm-n90_pie asm-toggle');
        key.append('text')
            .attr('x', w + 3)
            .attr('y', w * 7 - 1)
            .text('N90 length (' + getReadableSeqSizeString(this.npct_length[899]) + ')')
            .attr('class', 'asm-key');

        //draw contig legend if available
        if (this.contigs) {
            const lctg = lg.append('g').attr('id', 'asm-g-contig_legend');
            txt = lctg
                .append('text')
                .attr('transform', 'translate(' + (-size / 2 + 10) + ',' + (size / 2 - 70) + ')')
                .attr('class', 'asm-bl_title');
            txt.append('tspan').text('Contig statistics');

            key = lctg.append('g').attr('transform', 'translate(' + (-size / 2 + 10) + ',' + (size / 2 - 62) + ')');
            key.append('rect').attr('height', w).attr('width', w).attr('class', 'asm-contig_count asm-toggle');
            count_txt = key
                .append('text')
                .attr('x', w + 2)
                .attr('y', w - 1)
                .attr('class', 'asm-key');
            count_txt.append('tspan').text('Log');
            count_txt.append('tspan').attr('baseline-shift', 'sub').attr('font-size', '75%').text(10);
            count_txt.append('tspan').text(' contig count (total ' + this.contig_count.toLocaleString() + ')');
            key.append('rect')
                .attr('y', w * 1.5)
                .attr('height', w)
                .attr('width', w)
                .attr('class', 'asm-contig asm-toggle');
            key.append('text')
                .attr('x', w + 3)
                .attr('y', w * 2.5 - 1)
                .text('Contig length (total ' + getReadableSeqSizeString(this.contig_sum, 0) + ')')
                .attr('class', 'asm-key');
        }

        // add adjustable scale legend
        const lscl = lg.append('g').attr('id', 'asm-g-scale_legend');
        txt = lscl
            .append('text')
            .attr('transform', 'translate(' + (-size / 2 + 10) + ',' + (size / 2 - 150) + ')')
            .attr('class', 'asm-bl_title');
        txt.append('tspan').text('Scale');

        key = lscl.append('g').attr('transform', 'translate(' + (-size / 2 + 10) + ',' + (size / 2 - 142) + ')');
        const circ_key = key
            .append('g')
            .attr('width', '100px')
            .attr('height', '14px')
            .attr('transform', 'translate(0,8)')
            .attr('id', 'asm-circ_scale_g');
        circ_key
            .append('circle')
            .attr('cx', w / 2)
            .attr('cy', w / 2)
            .attr('r', w / 2)
            .attr('class', 'asm-axis');
        circ_key
            .append('line')
            .attr('x1', w / 2)
            .attr('y1', 0)
            .attr('x2', w / 2)
            .attr('y2', w / 2)
            .attr('class', 'asm-axis asm-narrow');
        const readable_circle_span = getReadableSeqSizeString(circle_span, 1);
        circ_key
            .append('text')
            .attr('x', w + 8)
            .attr('y', w - 1)
            .text(readable_circle_span)
            .attr('class', 'asm-key');
        const rad_key = key
            .append('g')
            .attr('width', '100px')
            .attr('height', '14px')
            .attr('transform', 'translate(0,' + w * 2.5 + ')')
            .attr('id', 'asm-rad_scale_g');
        rad_key
            .append('circle')
            .attr('cx', w / 2)
            .attr('cy', w / 2)
            .attr('r', w / 2)
            .attr('class', 'asm-axis asm-narrow');
        rad_key
            .append('line')
            .attr('x1', w / 2)
            .attr('y1', 0)
            .attr('x2', w / 2)
            .attr('y2', w / 2)
            .attr('class', 'asm-axis');
        const readable_longest = getReadableSeqSizeString(longest, 1);
        rad_key
            .append('text')
            .attr('x', w + 8)
            .attr('y', w - 1)
            .text(readable_longest)
            .attr('class', 'asm-key');

        // setup form
        /**
        var form_div_wrapper = parent.append('div').attr('id', 'asm-scale_form_wrapper').attr('class', 'hidden');
        var form_div_bg = form_div_wrapper.append('div').attr('id', 'asm-scale_form_bg');
        var form_div = form_div_bg.append('div').attr('id', 'asm-scale_form_div');
        var form = form_div.append('form').attr('id', 'asm-scale_form');
        form.append('label').attr('for', 'asm-circ_scale_input').text('circumference scale:').attr('class', 'asm-form_label');
        form.append('input')
            .attr('type', 'text')
            .property('value', readable_circle_span)
            .attr('placeholder', readable_circle_span)
            .attr('id', 'asm-circ_scale_input')
            .attr('class', 'asm-form_element');
        form.append('br');
        form.append('label').attr('for', 'asm-rad_scale_input').text('radial scale:').attr('class', 'asm-form_label');
        form.append('input')
            .attr('type', 'text')
            .property('value', readable_longest)
            .attr('placeholder', readable_longest)
            .attr('id', 'asm-rad_scale_input')
            .attr('class', 'asm-form_element');
        form.append('br');
        form.append('input').attr('type', 'submit').attr('class', 'asm-form_element');
        var asm = this;

        form.on('submit', function (event) {
            event.preventDefault();

            const circ_val = toInt(parent.select('#asm-circ_scale_input').property('value'));
            const rad_val = toInt(parent.select('#asm-rad_scale_input').property('value'));

            asm.reDrawPlot(parent, rad_val, circ_val);
        });

        // hide form
        form_div_wrapper.on('click', function () {
            form_div_wrapper.classed('hidden', true);
        });
        form_div.on('click', function () {
            d3.event.stopPropagation();
        });

        // toggle form visibility
        // TODO - fix bug with position in screen coords
        d3.selectAll('#' + parent_div + ' .asm-scale_rect').on('click', function () {
            form_div_wrapper.classed('hidden', !form_div_wrapper.classed('hidden'));
            var rect = svg.node().getBoundingClientRect();
            form_div_wrapper.style('height', rect.height);
            form_div_wrapper.style('width', rect.width);

            form_div_bg.style('height', rect.height > rect.width ? rect.width : rect.height);
            form_div_bg.style('width', rect.height > rect.width ? rect.width : rect.height);
        });
        **/
        // toggle plot features
        document.querySelectorAll(`#${parent_div} .asm-toggle`).forEach((button) => {
            button.addEventListener('click', () => {
                const classNames = Array.from(button.classList);

                const fill = getComputedStyle(button).fill;
                const isHidden = fill === 'rgb(255, 255, 255)' || fill === '#ffffff';

                if (!isHidden) {
                    button.style.fill = 'rgb(255, 255, 255)';
                    classNames.forEach((className) => {
                        if (className !== 'asm-toggle') {
                            document.querySelectorAll(`#${parent_div} .${className}`).forEach((element) => {
                                if (element !== button) {
                                    element.style.visibility = 'hidden';
                                }
                            });
                        }
                    });
                } else {
                    button.style.fill = getComputedStyle(button).stroke;
                    classNames.forEach((className) => {
                        if (className !== 'asm-toggle') {
                            document.querySelectorAll(`#${parent_div} .${className}`).forEach((element) => {
                                if (element !== button) {
                                    element.style.visibility = 'visible';
                                }
                            });
                        }
                    });
                }
            });
        });

        // show stats for any N value on mouseover
        var overlay = g.append('g');
        var path = overlay.append('path');
        var overoverlay = overlay.append('g');
        var output = overlay.append('g').attr('transform', 'translate(' + (size / 2 - 142) + ',' + (size / 2 - 128) + ')');
        var output_rect = output.append('rect').attr('class', 'asm-live_stats hidden').attr('height', 110).attr('width', 150);
        var output_text = output
            .append('g')
            .attr('transform', 'translate(' + 2 + ',' + 18 + ')')
            .attr('class', 'hidden');
        //  var output_gc = output.append('g').attr('transform', 'translate(' + (17) + ',' + (18) + ')').attr('class', 'hidden');
        var gc_circle = overoverlay.append('circle').attr('r', radii.percent[0]).attr('fill', 'white').style('opacity', 0);
        var stat_circle = overoverlay.append('circle').attr('r', radii.core[1]).attr('fill', 'white').style('opacity', 0);
        stat_circle.on('mousemove', function () {
            output_rect.classed('hidden', false);
            output_text.classed('hidden', false);
            path.classed('hidden', false);
            output_text.selectAll('text').remove();

            var point = d3.pointer(this);
            var angle = (50.5 + (50 / Math.PI) * Math.atan2(-point[0], point[1])).toFixed(0);
            angle = Math.floor((angle * p100Scale(100)) / pScale(100) + 0.1);

            if (angle <= 100) {
                var arc = d3
                    .arc()
                    .innerRadius(radii.core[1])
                    .outerRadius(radii.core[0])
                    .startAngle(pScale(angle - 1))
                    .endAngle(pScale(angle));
                path.attr('d', arc).attr('class', 'asm-live_segment');

                var txt = output_text.append('text').attr('class', 'asm-live_title text-asm');
                txt.append('tspan').text('N' + angle);
                output_text
                    .append('text')
                    .attr('y', 18)
                    .text(npct_count[angle * 10 - 1].toLocaleString() + ' scaffolds')
                    .attr('class', 'asm-key');
                output_text
                    .append('text')
                    .attr('x', 120)
                    .attr('y', w * 1.2 + 18)
                    .text('>= ' + getReadableSeqSizeString(npct_length[angle * 10 - 1]))
                    .attr('class', 'asm-key asm-right');
                if (this.nctg_length) {
                    output_text
                        .append('text')
                        .attr('y', w * 3 + 18)
                        .text(nctg_count[angle * 10 - 1].toLocaleString() + ' contigs')
                        .attr('class', 'asm-key');
                    output_text
                        .append('text')
                        .attr('x', 120)
                        .attr('y', w * 4.2 + 18)
                        .text('>= ' + getReadableSeqSizeString(this.nctg_length[angle * 10 - 1]))
                        .attr('class', 'asm-key asm-right');
                }
            } else {
                output_rect.classed('hidden', true);
                output_text.classed('hidden', true);
                path.classed('hidden', true);
            }
        });
        stat_circle.on('mouseout', function () {
            output_rect.classed('hidden', true);
            output_text.classed('hidden', true);
            path.classed('hidden', true);
        });

        // update gc content stats on mouseover
        if (typeof this.GCs != 'undefined' && this.GCs instanceof Array) {
            GCs = this.GCs;
            Ns = this.Ns;
            if (Object.prototype.hasOwnProperty.call(Ns[0], 'mean')) {
                Ns = Ns.map(function (d) {
                    return d.mean;
                });
                GCs = this.GCs.map(function (d) {
                    return d.mean;
                });
            }
            let slow_plot;
            gc_circle.on('mousemove', function (event) {
                clearTimeout(slow_plot);
                path.classed('hidden', false);
                const point = d3.pointer(event, this);
                let angle = (50.5 + (50 / Math.PI) * Math.atan2(-point[0], point[1])).toFixed(0);
                angle = Math.floor((angle * p100Scale(100)) / pScale(100) + 0.1);

                if (angle <= 100) {
                    slow_plot = setTimeout(function () {
                        const arc = d3
                            .arc()
                            .innerRadius(radii.core[0])
                            .outerRadius(radii.percent[0])
                            .startAngle(pScale(angle - 1))
                            .endAngle(pScale(angle));

                        path.attr('d', arc).attr('class', 'asm-live_segment');
                        const txt = output_text.append('text').attr('class', 'asm-live_title');
                        txt.append('tspan').text(`${angle - 1}-${angle}%`);
                        const seg_n = Ns.slice((angle - 1) * 10, angle * 10).reduce((a, b) => a + b, 0) / 10;
                        const seg_gc = GCs.slice((angle - 1) * 10, angle * 10).reduce((a, b) => a + b, 0) / 10;
                        parent.select('#asm-at_value').text(`AT (${(100 - seg_gc).toFixed(1)}%)`);
                        parent.select('#asm-gc_value').text(`GC (${seg_gc.toFixed(1)}%)`);
                        parent.select('#asm-n_value').text(`N (${seg_n.toFixed(1)}%)`);
                    });
                } else {
                    clearTimeout(slow_plot);
                    parent.select('#asm-at_value').text(at_text);
                    parent.select('#asm-gc_value').text(gc_text);
                    parent.select('#asm-n_value').text(n_text);
                    path.classed('hidden', true);
                }
            });

            gc_circle.on('mouseout', function () {
                clearTimeout(slow_plot);

                parent.select('#asm-at_value').text(at_text);
                parent.select('#asm-gc_value').text(gc_text);
                parent.select('#asm-n_value').text(n_text);

                path.classed('hidden', true);
            });
        }
    }
    reDrawPlot(parent, longest, circle_span) {
        parent.html('');
        this.drawPlot(parent.attr('id'), longest, circle_span);
    }
}

function circumference_axis(parent, radii, scale) {
    const g = parent.append('g');
    const axis = d3.arc().innerRadius(radii.core[1]).outerRadius(radii.core[1]).startAngle(scale(0)).endAngle(scale(100));
    g.append('path').attr('d', axis).attr('class', 'asm-axis');
    let seq = Array.apply(0, Array(50)).map(function (x, y) {
        return y * 2;
    });
    seq.forEach(function (i, index) {
        const tick = d3.arc().innerRadius(radii.core.minorTick[0]).outerRadius(radii.core.minorTick[1]).startAngle(scale(i)).endAngle(scale(i));
        g.append('path').attr('d', tick).attr('class', 'asm-minorTick');
    });
    seq = Array.apply(0, Array(11)).map(function (x, y) {
        return y * 10;
    });
    seq.forEach(function (i, index) {
        const tick = d3.arc().innerRadius(radii.core.majorTick[0]).outerRadius(radii.core.majorTick[1]).startAngle(scale(i)).endAngle(scale(i));
        g.append('path').attr('d', tick).attr('class', 'asm-majorTick');
        const x = Math.cos(scale(i) - Math.PI / 2) * (radii.core.majorTick[1] + 10);
        const y = Math.sin(scale(i) - Math.PI / 2) * (radii.core.majorTick[1] + 10);
        g.append('text')
            .text(function () {
                return index > 0 ? (index === 10 && scale(100) < 1.96 * Math.PI ? '100%' : index < 10 ? index * 10 : '') : '0%';
            })
            .attr('transform', 'translate(' + x + ',' + y + ') rotate(' + scale(i) / (Math.PI / 180) + ')')
            .attr('class', 'text-asm');
    });
}

function percent_axis(parent, radii, scale) {
    const g = parent.append('g');
    const axis = d3.arc().innerRadius(radii.percent[0]).outerRadius(radii.percent[0]).startAngle(scale(0)).endAngle(scale(100));
    g.append('path').attr('d', axis).attr('class', 'asm-axis');
    let seq = Array.apply(0, Array(11)).map(function (x, y) {
        return y * 10;
    });
    seq.forEach(function (d, _) {
        const arc = d3.arc()
            .innerRadius(radii.percent.majorTick[0])
            .outerRadius(radii.percent.majorTick[1])
            .startAngle(scale(d))
            .endAngle(scale(d));
        g.append('path').attr('d', arc).attr('class', 'asm-majorTick');
    });
    seq = Array.apply(0, Array(50)).map(function (x, y) {
        return y * 2;
    });
    seq.forEach(function (d) {
        const arc = d3
            .arc()
            .innerRadius(radii.percent.minorTick[0])
            .outerRadius(radii.percent.minorTick[1])
            .startAngle(scale(d))
            .endAngle(scale(d));
        g.append('path').attr('d', arc).attr('class', 'asm-minorTick');
    });
}

function cegma_axis(parent, radii, scale) {
    const g = parent.append('g');
    const axis = d3.arc().innerRadius(radii.ceg[2]).outerRadius(radii.ceg[2]).startAngle(scale(0)).endAngle(scale(100));
    g.append('path').attr('d', axis).attr('class', 'asm-axis');
    let seq = Array.apply(0, Array(10)).map(function (x, y) {
        return y * 10;
    });
    seq.forEach(function (d, _) {
        const arc = d3.arc().innerRadius(radii.ceg.majorTick[0]).outerRadius(radii.ceg.majorTick[1]).startAngle(scale(d)).endAngle(scale(d));
        g.append('path').attr('d', arc).attr('class', 'asm-majorTick');
        if (d % 20 === 0) {
            const x = Math.cos(scale(d) - Math.PI / 2) * (radii.ceg.majorTick[1] + 5);
            const y = Math.sin(scale(d) - Math.PI / 2) * (radii.ceg.majorTick[1] + 5);
            g.append('text')
                .text(function () {
                    return d > 0 ? d : d + '%';
                })
                .attr('transform', 'translate(' + x + ',' + y + ') rotate(' + scale(d) / (Math.PI / 180) + ')');
        }
    });

    seq = Array.apply(0, Array(21)).map(function (x, y) {
        return y * 5;
    });
    seq.forEach(function (d) {
        const arc = d3.arc().innerRadius(radii.ceg.minorTick[0]).outerRadius(radii.ceg.minorTick[1]).startAngle(scale(d)).endAngle(scale(d));
        g.append('path').attr('d', arc).attr('class', 'asm-minorTick');
    });
}

function plot_arc(parent, inner, outer, start, end, css) {
    const arc = d3.arc().innerRadius(inner).outerRadius(outer).startAngle(start).endAngle(end);
    parent.append('path').attr('d', arc).attr('class', css);
}

function toInt(number) {
    number = number.replace(/[,\s]+/g, '');
    let suffix = number.slice(-2);
    if (suffix.match(/\w[bB]/)) {
        number = number.replace(suffix, '');
        suffix = suffix.toLowerCase();
        const convert = {
            kb: 1000,
            mb: 1000000,
            gb: 1000000000,
            tb: 1000000000000,
        };
        if (isNaN(parseFloat(number)) || !isFinite(number)) {
            return 0;
        }
        number = number * convert[suffix];
    }
    return number;
}

function getReadableSeqSizeString(seqSizeInBases, fixed) {
    // function based on answer at http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
    let i = -1;
    const baseUnits = [' kB', ' MB', ' GB', ' TB'];
    do {
        seqSizeInBases = seqSizeInBases / 1000;
        i++;
    } while (seqSizeInBases >= 1000);
    fixed = fixed ? fixed : fixed === 0 ? 0 : 1;
    return Math.max(seqSizeInBases, 0.1).toFixed(fixed) + baseUnits[i];
}
