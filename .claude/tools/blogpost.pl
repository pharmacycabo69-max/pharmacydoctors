#!/usr/bin/perl
# Publish a blog article from a JSON spec using the site's article layout.
# Usage (from the site root):  perl .claude/tools/blogpost.pl path/to/post.json [more.json ...]
# Updates: <slug>/index.html, category/blog/index.html (post list), sitemap.xml.
use strict; use warnings; use utf8;
use JSON::PP;
binmode STDOUT, ':utf8';
my $B = 'https://www.pharmacydoctors.com';
my $SHELL_POST = 'house-call-doctor-cabo/index.html';   # any existing article page works as the shell

sub slurp { my $f = shift; open my $i, '<:raw', $f or die "$f: $!"; local $/; my $s = <$i>; close $i; utf8::decode($s); $s }
sub spit { my ($f, $c) = @_; (my $d = $f) =~ s{/[^/]+$}{}; mkdir $d unless -d $d; open my $o, '>:raw', $f or die "$f: $!"; my $x = $c; utf8::encode($x); print $o $x; close $o }
sub attr { my $s = shift // ''; $s =~ s/<[^>]+>//g; $s =~ s/&(?![a-z#0-9]+;)/&amp;/g; $s =~ s/"/&quot;/g; $s }
sub jsn { my $s = shift // ''; $s =~ s/<[^>]+>//g; $s =~ s/&amp;/&/g; $s =~ s/&mdash;/—/g; $s =~ s/&ndash;/–/g; $s =~ s/&rsquo;/'/g; $s =~ s/&[a-z#0-9]+;//g; $s =~ s/\\/\\\\/g; $s =~ s/"/\\"/g; $s =~ s/\s+/ /g; $s }
sub slugify { my $s = lc shift; $s =~ s/<[^>]+>//g; $s =~ s/&[a-z#0-9]+;//g; $s =~ s/[^a-z0-9]+/-/g; $s =~ s/^-|-$//g; substr($s, 0, 60) }
sub enc { my $m = shift; utf8::encode($m); $m =~ s/([^A-Za-z0-9\-_.~])/sprintf('%%%02X', ord $1)/ge; $m }
my @MON = qw(January February March April May June July August September October November December);
sub pretty { my ($y, $m, $d) = split /-/, shift; "$MON[$m-1] " . ($d + 0) . ", $y" }

my $shell = slurp($SHELL_POST);
my ($svc) = $shell =~ m{(<section class="sec svc-sec".*?</section>)}s or die 'svc section not found in shell';
my ($final) = $shell =~ m{(<section class="final".*?</section>)}s or die 'final section not found in shell';

for my $file (@ARGV) {
  my $p = JSON::PP->new->utf8->decode(do { open my $i, '<:raw', $file or die "$file: $!"; local $/; <$i> });
  for my $k (qw(slug title description h1 date image)) { die "$file: missing $k\n" unless $p->{$k} }
  die "$file: slug must be lowercase-with-dashes\n" unless $p->{slug} =~ /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  die "$file: page /$p->{slug}/ already exists\n" if -e "$p->{slug}/index.html" && !$p->{overwrite};
  die "$file: image $p->{image} not found\n" unless -f substr($p->{image}, 1);
  my $url = "$B/$p->{slug}/";
  my $wa = 'https://wa.me/526242261023?text=' . enc($p->{whatsapp} // "Hi! I read your guide \"" . jsn($p->{h1}) . "\" and need help in Cabo.");
  (my $waA = $wa) =~ s/&/&amp;/g;
  my $cta = sub { my ($t, $x) = @_; qq{<div class="art-cta"><div><b>$t</b><span>$x</span></div><a class="btn btn-wa" href="$waA" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Message us 24/7</a></div>} };

  # body
  my ($toc, $art, $k) = ('', '', 0);
  my @heads;
  $art .= "<p>$_</p>\n" for @{ $p->{intro} || [] };
  for my $s (@{ $p->{sections} || [] }) {
    my $id = slugify($s->{h2}); push @heads, [$id, $s->{h2}];
    $art .= qq{<h2 id="$id">$s->{h2}</h2>\n};
    $art .= "<p>$_</p>\n" for @{ $s->{p} || [] };
    $art .= '<ul>' . join('', map { "<li>$_</li>" } @{ $s->{list} }) . "</ul>\n" if $s->{list};
    for my $h3 (@{ $s->{h3} || [] }) { $art .= "<h3>$h3->{h}</h3>\n"; $art .= "<p>$_</p>\n" for @{ $h3->{p} || [] }; $art .= '<ul>' . join('', map { "<li>$_</li>" } @{ $h3->{list} }) . "</ul>\n" if $h3->{list} }
    $art .= "<p>$_</p>\n" for @{ $s->{p_after} || [] };
    if (++$k == 2) { $art .= $cta->($p->{cta_mid}{title} // 'Need a doctor, IV or medicine in Cabo?', $p->{cta_mid}{text} // 'House calls $199 USD &middot; IV drips from $159 + tax &middot; groups of 6+ $119 per person, tax included &middot; pharmacy delivery 24/7') . "\n" }
  }
  $toc = @heads > 2 ? '<nav class="toc" aria-label="Contents"><b>In this article</b><ol>' . join('', map { qq{<li><a href="#$_->[0]">$_->[1]</a></li>} } @heads) . '</ol></nav>' : '';
  my @faq = @{ $p->{faq} || [] };
  my $faqH = @faq ? '<h2 id="faq">Frequently asked questions</h2><div class="faq">' . join("\n", map { "<details><summary>$_->{q}</summary><p>$_->{a}</p></details>" } @faq) . '</div>' : '';
  my $rel = @{ $p->{related} || [] } ? '<p><strong>Related:</strong> ' . join(' &middot; ', map { qq{<a href="$_->[0]">$_->[1]</a>} } @{ $p->{related} }) . '</p>' : '';
  my $h1 = $p->{h1}; my $alt = attr($p->{image_alt} // $p->{h1});
  my $main = qq{<div class="wrap crumbs"><a href="/">Home</a> &rsaquo; <a href="/category/blog/">Blog</a> &rsaquo; <span>$h1</span></div>
<article class="art-wrap">
  <header class="art-head"><span class="eyebrow">@{[ $p->{eyebrow} // 'Cabo health guide' ]}</span><h1>$h1</h1>
    <div class="art-meta"><span>By <b>Pharmacy &amp; Doctors medical team</b></span><span>Published @{[ pretty($p->{date}) ]}</span><span>COFEPRIS authorization #05-022-B</span></div>
    <div class="art-img"><img src="$p->{image}" alt="$alt" fetchpriority="high"></div>
  </header>
  $toc
  <div class="art">$art
  $faqH
  } . $cta->($p->{cta_end}{title} // 'Feeling unwell in Cabo?', $p->{cta_end}{text} // 'An English-speaking doctor ($199) or a licensed nurse with an IV (from $159 + tax) can be with you in about 30&ndash;45 minutes.') . qq{
  $rel
  <p style="font-size:.85rem;color:var(--muted)">This article is general information, not medical advice. In a life-threatening emergency call 911.</p>
  </div>
</article>
$svc
$final};

  # head + schema
  my $faqS = @faq ? ',{"@type":"FAQPage","mainEntity":[' . join(',', map { '{"@type":"Question","name":"' . jsn($_->{q}) . '","acceptedAnswer":{"@type":"Answer","text":"' . jsn($_->{a}) . '"}}' } @faq) . ']}' : '';
  my $schema = qq~{"\@type":"BlogPosting","\@id":"$url#article","headline":"~ . jsn($h1) . qq~","description":"~ . jsn($p->{description}) . qq~","image":"$B$p->{image}","datePublished":"$p->{date}","dateModified":"$p->{date}","inLanguage":"en-US","mainEntityOfPage":"$url","author":{"\@type":"Organization","name":"Pharmacy & Doctors Cabo medical team","url":"$B/about-us/"},"publisher":{"\@type":"Organization","name":"Pharmacy & Doctors Cabo","logo":{"\@type":"ImageObject","url":"$B/assets/logo.svg"}}},~
    . qq~{"\@type":"BreadcrumbList","itemListElement":[{"\@type":"ListItem","position":1,"name":"Home","item":"$B/"},{"\@type":"ListItem","position":2,"name":"Blog","item":"$B/category/blog/"},{"\@type":"ListItem","position":3,"name":"~ . jsn($h1) . qq~","item":"$url"}]}~ . $faqS;
  my $h = $shell;
  my ($t, $d) = (attr($p->{title}), attr($p->{description}));
  $h =~ s{<title>.*?</title>}{<title>$t</title>}s;
  $h =~ s{(<meta name="description" content=")[^"]*}{$1$d};
  $h =~ s{(<meta property="og:description" content=")[^"]*}{$1$d};
  $h =~ s{(<meta name="twitter:description" content=")[^"]*}{$1$d};
  $h =~ s{(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*}{$1$t}g;
  $h =~ s{(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*}{$1$B$p->{image}}g;
  $h =~ s{<link rel="canonical" href="[^"]*">}{<link rel="canonical" href="$url">};
  $h =~ s{<meta property="og:url" content="[^"]*">}{<meta property="og:url" content="$url">};
  $h =~ s{<link rel="preload" as="image"[^>]*>}{<link rel="preload" as="image" href="$p->{image}" fetchpriority="high">};
  $h =~ s{<script type="application/ld\+json">.*?</script>}{<script type="application/ld+json">{"\@context":"https://schema.org","\@graph":[$schema]}</script>}s;
  $h =~ s{<main id="main">.*?</main>}{<main id="main">\n$main\n</main>}s or die 'main';
  $h =~ s{(<div class="pd-cta"[^>]*><a class="pd-wa" href=")[^"]*}{$1$waA};
  spit("$p->{slug}/index.html", $h);
  print "published /$p->{slug}/ (" . int(length($h) / 1024) . " KB)\n";

  # sitemap
  my $sm = slurp('sitemap.xml');
  unless ($sm =~ m{<loc>\Q$url\E</loc>}) {
    $sm =~ s{</urlset>}{  <url><loc>$url</loc><lastmod>$p->{date}</lastmod><priority>0.7</priority></url>\n</urlset>};
    spit('sitemap.xml', $sm);
  }
}

# ---- rebuild the blog index from every BlogPosting page ----
my @posts;
for my $f (glob('*/index.html')) {
  my $s = slurp($f);
  next unless $s =~ /"\@type":"BlogPosting","\@id"/;
  my ($slug) = $f =~ m{^([^/]+)/};
  my ($h) = $s =~ /"headline":"((?:[^"\\]|\\.)*)"/; my ($img) = $s =~ /"image":"https?:\/\/[^\/]+([^"]+)"/;
  my ($date) = $s =~ /"datePublished":"([^"]+)"/; my ($desc) = $s =~ /<meta name="description" content="([^"]*)"/;
  $h =~ s/\\"/"/g; $h =~ s/&/&amp;/g; $h =~ s/&amp;(amp|[a-z]+|#\d+);/&$1;/g;
  push @posts, { slug => $slug, h => $h, img => $img // '', date => $date // '2026-01-01', desc => $desc // '' };
}
@posts = sort { $b->{date} cmp $a->{date} || $a->{slug} cmp $b->{slug} } @posts;
my $cards = join "\n", map { my $pd = pretty(substr($_->{date}, 0, 10));
  qq{<a class="post" href="/$_->{slug}/"><div class="post-img"><img src="$_->{img}" alt="$_->{h}" loading="lazy"></div><div class="post-b"><small>$pd</small><h2>$_->{h}</h2><p>$_->{desc}</p><span>Read the guide &rarr;</span></div></a>} } @posts;
my $idx = slurp('category/blog/index.html');
$idx =~ s{<div class="posts">.*?</div>\s*</div>\s*</section>}{<div class="posts">$cards</div>\n</div></section>}s or die 'blog index posts block';
my $parts = join(',', map { my $hh = jsn($_->{h}); qq~{"\@type":"BlogPosting","headline":"$hh","url":"$B/$_->{slug}/"}~ } @posts);
$idx =~ s{("hasPart":\[).*?(\]\})}{$1$parts$2}s;
spit('category/blog/index.html', $idx);
print "blog index: " . scalar(@posts) . " posts\n";
