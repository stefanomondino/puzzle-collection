#!/usr/bin/env node
/**
 * Fetches song data from iTunes for all La Bamba genres/artists
 * and writes labamba-songs.json.
 *
 * Usage: node generate-labamba-data.mjs
 */

const GENRES = {
  'Pop': [
    'Michael Jackson', 'Madonna', 'Ed Sheeran', 'Adele', 'Bruno Mars',
    'Taylor Swift', 'Rihanna', 'Lady Gaga', 'Dua Lipa', 'The Weeknd',
    'Beyonce', 'Justin Timberlake', 'Katy Perry', 'Shakira', 'Coldplay',
    'Maroon 5', 'Pink', 'Sam Smith', 'Billie Eilish', 'Harry Styles',
    'Ariana Grande', 'Post Malone', 'Sia', 'Imagine Dragons', 'OneRepublic'
  ],
  'Italiana': [
    'Lucio Battisti', 'Mina', 'Vasco Rossi', 'Ligabue', 'Laura Pausini',
    'Eros Ramazzotti', 'Zucchero', 'Tiziano Ferro', 'Jovanotti', 'Adriano Celentano',
    'Fabrizio De Andre', 'Franco Battiato', 'Gianna Nannini', 'Pino Daniele', 'Renato Zero',
    'Claudio Baglioni', 'Cesare Cremonini', 'Elisa', 'Negramaro', 'Moda',
    'Maneskin', 'Blanco', 'Mahmood', 'Annalisa', 'Ultimo'
  ],
  'Rock': [
    'Queen', 'Led Zeppelin', 'Pink Floyd', 'AC DC', 'Nirvana',
    'U2', 'Guns N Roses', 'The Rolling Stones', 'Foo Fighters', 'Red Hot Chili Peppers',
    'Bon Jovi', 'Aerosmith', 'Metallica', 'Green Day', 'Linkin Park',
    'Oasis', 'Radiohead', 'The Who', 'Deep Purple', 'Black Sabbath',
    'The Beatles', 'The Doors', 'Jimi Hendrix', 'Eric Clapton', 'Eagles',
    'Fleetwood Mac', 'The Police', 'Rush', 'ZZ Top', 'Creedence Clearwater Revival',
    'Lynyrd Skynyrd', 'The Clash', 'Ramones', 'Sex Pistols', 'Joy Division',
    'Pixies', 'Sonic Youth', 'The Smiths', 'R.E.M.', 'Pearl Jam',
    'Soundgarden', 'Alice in Chains', 'Stone Temple Pilots', 'Smashing Pumpkins', 'Weezer',
    'Blink 182', 'Sum 41', 'The Offspring', 'System of a Down', 'Tool',
    'Rage Against the Machine', 'Muse', 'Arctic Monkeys', 'The Strokes', 'Kings of Leon',
    'The Black Keys', 'Jack White', 'Tame Impala', 'Gorillaz', 'Blur',
    'Iron Maiden', 'Megadeth', 'Slayer', 'Pantera', 'Judas Priest',
    'Motley Crue', 'Def Leppard', 'Scorpions', 'Kiss', 'Van Halen',
    'Journey', 'Foreigner', 'Boston', 'Styx', 'Kansas',
    'Yes', 'Genesis', 'King Crimson', 'Jethro Tull', 'Supertramp',
    'Dire Straits', 'Tom Petty', 'Bruce Springsteen', 'Bob Dylan', 'Neil Young',
    'Cream', 'The Yardbirds', 'Jeff Beck', 'Santana', 'Stevie Ray Vaughan'
  ],
  'Anni 80': [
    'a-ha', 'Duran Duran', 'Depeche Mode', 'Cyndi Lauper', 'Tears for Fears',
    'Eurythmics', 'Wham', 'Culture Club', 'Spandau Ballet', 'Pet Shop Boys',
    'Simple Minds', 'The Cure', 'Frankie Goes to Hollywood', 'Bonnie Tyler', 'Toto',
    'Phil Collins', 'Dire Straits', 'Bryan Adams', 'Whitney Houston', 'George Michael'
  ]
};

import { writeFileSync } from 'fs';

function artistMatches(resultArtist, searchTerm) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm(resultArtist).includes(norm(searchTerm)) || norm(searchTerm).includes(norm(resultArtist));
}

async function fetchFromiTunes(term, limit = 10) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&attribute=artistTerm&limit=${limit}&country=it`;
  const resp = await fetch(url);
  if (resp.status === 429) {
    console.log(`  ⏳ Rate limited, waiting 10s...`);
    await new Promise(r => setTimeout(r, 10000));
    return fetchFromiTunes(term, limit);
  }
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${term}`);
  const data = await resp.json();
  return data.results
    .filter(r => r.previewUrl && r.trackName && r.artistName && artistMatches(r.artistName, term))
    .map(r => ({
      id: r.trackId,
      t: r.trackName,
      a: r.artistName,
      img: r.artworkUrl100 || '',
      p: r.previewUrl
    }));
}

async function fetchFromDeezer(term, limit = 10) {
  const url = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(term)}"&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Deezer HTTP ${resp.status} for ${term}`);
  const data = await resp.json();
  if (!data.data) return [];
  return data.data
    .filter(r => r.preview && r.title && r.artist && artistMatches(r.artist.name, term))
    .map(r => ({
      id: 'dz_' + r.id,
      t: r.title,
      a: r.artist.name,
      img: r.album && r.album.cover_medium ? r.album.cover_medium : '',
      p: r.preview
    }));
}

async function fetchArtist(term, limit = 10) {
  try {
    const results = await fetchFromiTunes(term, limit);
    if (results.length > 0) return results;
  } catch(e) {
    // iTunes failed, try Deezer
  }
  try {
    return await fetchFromDeezer(term, limit);
  } catch(e) {
    throw new Error(`Both APIs failed for ${term}`);
  }
}

async function main() {
  const output = {};
  const allGenres = Object.keys(GENRES);

  for (const genre of allGenres) {
    console.log(`\n🎵 Genre: ${genre} (${GENRES[genre].length} artists)`);
    output[genre] = [];
    const seen = new Set();

    for (let i = 0; i < GENRES[genre].length; i++) {
      const artist = GENRES[genre][i];
      process.stdout.write(`  [${i + 1}/${GENRES[genre].length}] ${artist}...`);
      try {
        const songs = await fetchArtist(artist, 10);
        let added = 0;
        for (const s of songs) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            output[genre].push(s);
            added++;
          }
        }
        console.log(` ${added} songs`);
      } catch (e) {
        console.log(` ERROR: ${e.message}`);
      }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`  ✅ ${genre}: ${output[genre].length} total songs`);
  }

  const json = JSON.stringify(output);
  writeFileSync('labamba-songs.json', json);
  console.log(`\n📦 Written labamba-songs.json (${(json.length / 1024).toFixed(0)} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
