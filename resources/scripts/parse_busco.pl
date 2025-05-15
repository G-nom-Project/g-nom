#!/usr/bin/perl
use strict;
use warnings;
use JSON;
use Scalar::Util qw(looks_like_number);

=head1 NAME

parse_busco.pl - Parse a BUSCO summary file and return the results as JSON

=head1 SYNOPSIS

    perl parse_busco.pl /path/to/short_summary.txt

=head1 DESCRIPTION

This script reads a BUSCO `short_summary.txt` file and extracts key metrics:

1) Dataset used (e.g., eukaryota_odb10)

2) Target file analyzed

3) BUSCO mode (e.g., proteins, genome, transcriptome)

4) Total, complete, duplicated, fragmented, and missing BUSCOs

5) Percentages of those categories

The output is printed as JSON.

=cut

my $file = shift @ARGV or die "Usage: $0 path_to_short_summary.txt\n";

open my $fh, '<', $file or die "Cannot open file '$file': $!\n";
my @lines = <$fh>;
close $fh;

my %data = (
    dataset => undef,
    targetFile => undef,
    buscoMode => undef,
    completeSingle => 0,
    completeDuplicated => 0,
    fragmented => 0,
    missing => 0,
    total => 0,
);

foreach my $line (@lines) {
    chomp $line;
    my $lower = lc($line);

    if ($line =~ /The lineage dataset is:\s*(\S+)/) {
        $data{dataset} = $1;
    }
    if ($line =~ /notation for file\s+(.+)$/) {
        $data{targetFile} = $1;
    }
    if ($line =~ /BUSCO was run in mode:\s*(\S+)/i) {
        $data{buscoMode} = $1;
    }

    if ($line =~ /^\s*(\d+)\s+Complete and single-copy BUSCOs/i) {
        $data{completeSingle} = int($1);
    }
    if ($line =~ /^\s*(\d+)\s+Complete and duplicated BUSCOs/i) {
        $data{completeDuplicated} = int($1);
    }
    if ($line =~ /^\s*(\d+)\s+Fragmented BUSCOs/i) {
        $data{fragmented} = int($1);
    }
    if ($line =~ /^\s*(\d+)\s+Missing BUSCOs/i) {
        $data{missing} = int($1);
    }
    if ($line =~ /^\s*(\d+)\s+Total BUSCO groups searched/i) {
        $data{total} = int($1);
    }
}

# Default missing fields to 0 if not set
$data{completeSingle}      //= 0;
$data{completeDuplicated}  //= 0;
$data{fragmented}          //= 0;
$data{missing}             //= 0;
$data{total}               //= 0;

# Percent calculations
if ($data{total} > 0) {
    $data{completeSinglePercent}     = ($data{completeSingle}     * 100) / $data{total};
    $data{completeDuplicatedPercent} = ($data{completeDuplicated} * 100) / $data{total};
    $data{fragmentedPercent}         = ($data{fragmented}         * 100) / $data{total};
    $data{missingPercent}            = ($data{missing}            * 100) / $data{total};
}

# Output JSON
my $json = JSON->new->utf8->pretty->encode(\%data);
print $json;

=head1 AUTHOR

Written by Lucas Koch, adapted from python code written by Andreas Wolf.

=head1 LICENSE

MIT License

=cut
