<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://github.com/G-nom-Project/g-nom/blob/main/public/images/gnom.png?raw=true" width="200" alt="Laravel Logo"></a></p>

<p align="center">
<img src="https://img.shields.io/github/license/G-nom-Project/g-nom" alt="License">
<img src="https://img.shields.io/github/v/release/G-nom-Project/g-nom" alt="Latest Release">
<a href="https://www.w3.org/RDF/"><img src="https://www.w3.org/Icons/SW/Buttons/sw-rdf-green-v.svg" alt="RDF Badge" height="20"></a>
<a href="https://www.w3.org/RDF/"><img src="https://www.w3.org/Icons/SW/Buttons/sw-sparql-green-v.svg" alt="SPARPQL Badge" height="20"></a>
<img src="https://img.shields.io/badge/Laravel-v13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel Badge" height="20">
</p>

# About G-nom
G-nom is a web-based platform for storage and organization of genome assemblies and related analyses. G-nom promotes a strong integration of analysis results with other analyses or data, offering a series of interactive visualizations to applied researchers.

We are currently in the process of migrating Laravel from a Flask + React stack to a more reliable monolithic Laravel project. Breaking changes are to be expected on our road to v1.0 .

G-nom is developed in the [Ebersberger Lab](https://github.com/BIONF) at the Goethe University Frankfurt and is licenced under GPLv2. 

# Acknowledgements
## Open source software
The G-nom tech stack includes open-source software, typically used as-is (via docker images) or with minor modifications. The table below lists software required for G-nom to function.

| Software        | Source                                | Copyright notice                                                                                                                                    | License                                                              |
|-----------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| Laravel Horizon | https://github.com/laravel/horizon    | Copyright (c) Taylor Otwell                                                                                                                         | MIT                                                                  |
| Laravel Reverb  | https://github.com/laravel/reverb     | Copyright (c) Taylor Otwell                                                                                                                         | MIT                                                                  |
| Redis           | https://github.com/redis/redis        | -                                                                                                                                                   | Redis Source Available License 2.0 (RSALv2) Agreement and others     |
| nginx           | https://github.com/nginx/nginx        | Copyright (C) 2002-2021 Igor Sysoev <br> Copyright (C) 2011-2026 Nginx, Inc.                                                                        | BSD2                                                                 |
| PostgreSQL      | https://github.com/postgres/postgres  | Portions Copyright (c) 1996-2026, PostgreSQL Global Development Group <br> Portions Copyright (c) 1994, The Regents of the University of California | [Custom](https://github.com/postgres/postgres/blob/master/COPYRIGHT) |
| QLever          | https://github.com/ad-freiburg/qlever | -                                                                                                                                                   | Apache 2.0                                                           |
## Open source code

The code used to dynamically generated trees using d3 in different parts of this application was adopted from the d3 example by Mike Bostock https://observablehq.com/@d3/tree-of-life, licensed under the ISC license.

The snail plots provided on the assembly page as well as the code used to produce the data consumed by the plot is adapted from 
https://zenodo.org/records/322347 by Richard Challis, licensed under the MIT License.


