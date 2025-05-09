#!/usr/bin/perl
use strict;
use warnings;
use File::Basename;
use File::Spec;
use File::stat;
use JSON;
use IO::Uncompress::Gunzip qw(gunzip $GunzipError);

# Constants
my $TYPE_AUTO_DETECT_ATGCU_THRESHOLD = 65;

# Argument
my $path = $ARGV[0] or die "Usage: $0 <fasta_file>\n";

# Check if file exists
unless (-e $path) {
    die "Path not found.\n";
}

my $filename = basename($path);

# Check extension
unless ($filename =~ /\.(fa|fasta|faa|fna|fa.gz|fasta.gz|faa.gz|fna.gz)$/) {
    die "Incorrect filetype! Only .fa/.fasta/.faa/.fna and .gz variants allowed.\n";
}

# Get number of lines
my $num_lines;
if ($filename =~ /\.gz$/) {
    # For gzip files, we need to handle it differently
    my $gz_fh;
    gunzip $path => \$gz_fh or die "gunzip failed: $GunzipError\n";
    $num_lines = `echo "$gz_fh" | wc -l`;
    chomp($num_lines);
} else {
    $num_lines = `wc -l < "$path"`;
    chomp($num_lines);
}

if ($num_lines == 0) {
    die "$filename is empty!\n";
}

# Init variables
my @sequences;
my %cumulative_char_counts;
my $cumulative_sequence_length = 0;
my %length_distribution = map { $_ => { n => 0, l => 0 } } (
    0, 1000, 2500, 5000, 10000, 25000, 50000,
    100000, 250000, 500000, 1000000, 2500000,
    5000000, 10000000, 25000000, 50000000
);

# Read FASTA
my $fh;
if ($filename =~ /\.gz$/) {
    # If file is gzipped, open it with Gunzip
    gunzip $path => \$fh or die "gunzip failed: $GunzipError\n";
} else {
    # Regular file, open as usual
    open $fh, '<', $path or die "Can't open file: $!\n";
}

my ($sequence, $header, $header_idx, $seq_length, %char_counts);
my $idx = 0;

while (my $line = <$fh>) {
    chomp($line);
    $idx++;

    if ($line =~ /^>/) {
        if (defined $sequence) {
            process_sequence();
        }

        $header = substr($line, 1);
        $header =~ s/\s.*$//;
        $header_idx = $idx;
        $sequence = '';
        $seq_length = 0;
        %char_counts = ();
    } else {
        $sequence .= $line;
        $seq_length += length($line);
        foreach my $char (split //, $line) {
            $char = uc($char);
            $cumulative_char_counts{$char}++;
            $char_counts{$char}++;
        }
    }
}

# Final sequence
process_sequence() if defined $sequence;
close $fh;

# Detect sequence type
my @dna_rna = qw(A C G T U N);
my $dna_rna_char_sum = 0;
foreach my $char (@dna_rna) {
    $dna_rna_char_sum += $cumulative_char_counts{$char} // 0;
    $dna_rna_char_sum += $cumulative_char_counts{lc $char} // 0;
}

my $sequence_type;
if ($dna_rna_char_sum * 100 / $cumulative_sequence_length <= $TYPE_AUTO_DETECT_ATGCU_THRESHOLD) {
    $sequence_type = 'protein';
} else {
    my $Ts = $cumulative_char_counts{"T"} // 0;
    my $Us = $cumulative_char_counts{"U"} // 0;
    $sequence_type = $Ts > $Us ? 'dna' : ($Us > $Ts ? 'rna' : '');
}

my $num_sequences = scalar @sequences;
# Sort by length
@sequences = sort { $b->{statistics}->{sequence_length} <=> $a->{statistics}->{sequence_length} } @sequences;

# Mean and median
my $mean = $cumulative_sequence_length / $num_sequences;
my $median = $num_sequences % 2
    ? $sequences[($num_sequences - 1)/2]->{statistics}->{sequence_length}
    : ($sequences[$num_sequences/2 - 1]->{statistics}->{sequence_length} + $sequences[$num_sequences/2]->{statistics}->{sequence_length}) / 2;

# N50/N90
my ($n50, $n90, $running_sum) = (0, 0, 0);
foreach my $seq (@sequences) {
    $running_sum += $seq->{statistics}->{sequence_length};
    $n50 = $seq->{statistics}->{sequence_length} if !$n50 && $running_sum * 100 / $cumulative_sequence_length >= 50;
    $n90 = $seq->{statistics}->{sequence_length} if !$n90 && $running_sum * 100 / $cumulative_sequence_length >= 90;
}

# GC
my $gc = ($cumulative_char_counts{"G"} // 0) + ($cumulative_char_counts{"C"} // 0);
my $gc_masked = $gc + ($cumulative_char_counts{"g"} // 0) + ($cumulative_char_counts{"c"} // 0);

my %result = (
    numberOfSequences => $num_sequences,
    sequenceType => $sequence_type,
    cumulativeSequenceLength => $cumulative_sequence_length,
    n50 => $n50,
    n90 => $n90,
    shortestSequence => 0,
    largestSequence => 0,
    meanSequence => $mean,
    medianSequence => $median,
    gcPercent =>  $gc / $cumulative_sequence_length,
    gcPercentMasked => $gc_masked / $cumulative_sequence_length,
    length_distribution => \%length_distribution

);

print encode_json(\%result);

sub process_sequence {
    foreach my $length (sort { $a <=> $b } keys %length_distribution) {
        if ($seq_length >= $length) {
            $length_distribution{$length}->{n}++;
            $length_distribution{$length}->{l} += $seq_length;
        }
    }

    my $gc = ($char_counts{"G"} // 0) + ($char_counts{"g"} // 0) +
             ($char_counts{"C"} // 0) + ($char_counts{"c"} // 0);
    my $gc_masked = ($char_counts{"g"} // 0) + ($char_counts{"c"} // 0);

    my $gc_ratio = $gc / $seq_length;
    my $gc_masked_ratio = ($gc + $gc_masked) / $seq_length;

    push @sequences, {
        header => $header,
        header_idx => $header_idx,
        sequence => $sequence,
        statistics => {
            sequence_length => $seq_length,
            char_counts => { %char_counts },
            GC_local => $gc_ratio,
            GC_local_masked => $gc_masked_ratio
        }
    };

    $cumulative_sequence_length += $seq_length;
}
