#!/usr/bin/env perl
use strict;
use warnings;

my $id_counter = 1;

while (<STDIN>) {
    chomp;
    next if /^\s*$/;

    s/^\s+|\s+$//g;
    my @f = split /\s+/;

    # ---- Skip bad rows / header ----
    next unless defined $f[0];

    # score must be numeric (filters header + garbage rows)
    next unless $f[0] =~ /^\d+(\.\d+)?$/;

    # sequence must look like contig name
    next unless defined $f[4] && $f[4] =~ /\w/;

    # start must be numeric
    next unless $f[5] =~ /^\d+$/;

    # ---- Core fields for GFF features ----
    my $score  = $f[0];
    my $seqid  = $f[4];
    my $start  = $f[5];
    my $end    = $f[6];

    my $strand = ($f[8] eq '+') ? '+' : '-';

    # ---- Name + Class for track features ----
    my $i = 9;

    # skip stray numeric columns (if any)
    $i++ while $i < @f && $f[$i] =~ /^\d+$/;

    my $repeat_name  = $f[$i]   // "unknown";
    my $repeat_class = $f[$i+1] // "unknown";

    my $rep_start = $f[$i+2] // ".";
    my $rep_end   = $f[$i+3] // ".";

    # ---- Write GFF ----
    my $id   = $f[$i+5] // ".";
    my $target = "$repeat_name";

    print join("\t",
        $seqid,
        "RepeatMasker",
        $repeat_class,
        $start,
        $end,
        $score,
        $strand,
        ".",
        "ID=$id;Target=$target;Class=$repeat_class;Score=$score"
    ), "\n";
}
