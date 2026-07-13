// One-off seed script for GROFO's catalog tables (videos, materials).
// Run with: node scripts/seed-grofo.mjs
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const videos = [
  // NEET
  { youtubeId: "0L09dhQLcts", title: "Genetics (Part 1) - Complete Unit in One Shot | NEET 2026", channel: "PW NEET", category: "NEET", type: "educational", durationSeconds: 13210, thumbnailUrl: "https://img.youtube.com/vi/0L09dhQLcts/hqdefault.jpg" },
  { youtubeId: "3i8mHECla2k", title: "The Living World - Complete Chapter | Class 11th NEET", channel: "Competition Wallah", category: "NEET", type: "educational", durationSeconds: 4472, thumbnailUrl: "https://img.youtube.com/vi/3i8mHECla2k/hqdefault.jpg" },
  { youtubeId: "acZpClySY8M", title: "Complete Class 11th Biology in 1 Shot | NEET 2024", channel: "Physics Wallah - Alakh Pandey", category: "NEET", type: "educational", durationSeconds: 42822, thumbnailUrl: "https://img.youtube.com/vi/acZpClySY8M/hqdefault.jpg" },
  // JEE
  { youtubeId: "UjFSsnu6Zns", title: "Rotational Motion in 1 Shot | JEE Main & Advanced", channel: "PW JEE Wallah", category: "JEE", type: "educational", durationSeconds: 5400, thumbnailUrl: "https://img.youtube.com/vi/UjFSsnu6Zns/hqdefault.jpg" },
  { youtubeId: "CIze30XzTkA", title: "Chemical Bonding - Super One Shot | Full Chapter", channel: "PW JEE Wallah", category: "JEE", type: "educational", durationSeconds: 6300, thumbnailUrl: "https://img.youtube.com/vi/CIze30XzTkA/hqdefault.jpg" },
  { youtubeId: "d1l6AJtTABE", title: "Rotational Motion (Lecture 10) | NV Sir", channel: "JEE Preparation", category: "JEE", type: "educational", durationSeconds: 3600, thumbnailUrl: "https://img.youtube.com/vi/d1l6AJtTABE/hqdefault.jpg" },
  // CLAT
  { youtubeId: "XT-yePc5iTo", title: "Introduction to Legal Reasoning | CLAT 2026", channel: "Decode Legal Reasoning", category: "CLAT", type: "educational", durationSeconds: 2700, thumbnailUrl: "https://img.youtube.com/vi/XT-yePc5iTo/hqdefault.jpg" },
  { youtubeId: "nxfXZbq0H-M", title: "Law of Contract Explained | Legal Reasoning Lecture 1", channel: "CLAT Prep", category: "CLAT", type: "educational", durationSeconds: 3200, thumbnailUrl: "https://img.youtube.com/vi/nxfXZbq0H-M/hqdefault.jpg" },
  // UPSC
  { youtubeId: "KfGueJkIYC8", title: "Complete Polity for UPSC 2027 | Polity for Beginners", channel: "StudyIQ IAS", category: "UPSC", type: "educational", durationSeconds: 9600, thumbnailUrl: "https://img.youtube.com/vi/KfGueJkIYC8/hqdefault.jpg" },
  { youtubeId: "AK82H8R9KBI", title: "Making of the Constitution | Complete Indian Polity", channel: "StudyIQ IAS", category: "UPSC", type: "educational", durationSeconds: 5100, thumbnailUrl: "https://img.youtube.com/vi/AK82H8R9KBI/hqdefault.jpg" },
  // Languages
  { youtubeId: "TsYMJQEtpJU", title: "Complete English Grammar | Full Beginner Course in 1 Hour", channel: "English Learning", category: "Languages", type: "educational", durationSeconds: 3600, thumbnailUrl: "https://img.youtube.com/vi/TsYMJQEtpJU/hqdefault.jpg" },
  { youtubeId: "FI2OKNMWGc4", title: "Basic English Grammar Course for Beginners | 37 Lessons", channel: "English Learning", category: "Languages", type: "educational", durationSeconds: 5400, thumbnailUrl: "https://img.youtube.com/vi/FI2OKNMWGc4/hqdefault.jpg" },
  // Motivation & Inspiration (kept separate from educational content)
  { youtubeId: "mgmVOuLgFB0", title: "Motivational Video for Students | Never Give Up", channel: "Study Motivation", category: "Motivation", type: "motivation", durationSeconds: 300, thumbnailUrl: "https://img.youtube.com/vi/mgmVOuLgFB0/hqdefault.jpg" },
  { youtubeId: "ZXsQAXx_ao0", title: "The Power of Discipline | Student Success Story", channel: "Study Motivation", category: "Motivation", type: "motivation", durationSeconds: 480, thumbnailUrl: "https://img.youtube.com/vi/ZXsQAXx_ao0/hqdefault.jpg" },
  // Study Music (focus / lofi)
  { youtubeId: "jfKfPfyJRdk", title: "lofi hip hop radio - beats to study/relax to", channel: "Lofi Girl", category: "Music", type: "music", durationSeconds: 7200, thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg" },
  { youtubeId: "5qap5aO4i9A", title: "lofi hip hop radio - beats to sleep/chill to", channel: "Lofi Girl", category: "Music", type: "music", durationSeconds: 7200, thumbnailUrl: "https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg" },
];

// These are real, publicly hosted NCERT textbook PDFs (ncert.nic.in). They are
// generic sample study material for demoing the PDF viewer/bookmark/highlight
// features -- not curated, category-specific syllabus content.
const materials = [
  { title: "NCERT Biology - Sample Chapter", category: "NEET", sourceUrl: "https://ncert.nic.in/textbook/pdf/kebo101.pdf", pageCount: null },
  { title: "NCERT Physics - Sample Chapter", category: "JEE", sourceUrl: "https://ncert.nic.in/textbook/pdf/keph101.pdf", pageCount: null },
  { title: "NCERT Reference PDF - Sample Material", category: "CLAT", sourceUrl: "https://ncert.nic.in/textbook/pdf/leac101.pdf", pageCount: null },
  { title: "NCERT Political Science - Sample Chapter", category: "UPSC", sourceUrl: "https://ncert.nic.in/textbook/pdf/leps101.pdf", pageCount: null },
  { title: "NCERT English - Sample Chapter", category: "Languages", sourceUrl: "https://ncert.nic.in/textbook/pdf/lehs101.pdf", pageCount: null },
];

async function main() {
  const client = await pool.connect();
  try {
    const { rows: existingVideos } = await client.query("SELECT count(*)::int AS count FROM videos");
    if (existingVideos[0].count === 0) {
      for (const v of videos) {
        await client.query(
          `INSERT INTO videos (youtube_id, title, channel, category, type, duration_seconds, thumbnail_url) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [v.youtubeId, v.title, v.channel, v.category, v.type, v.durationSeconds, v.thumbnailUrl],
        );
      }
      console.log(`Seeded ${videos.length} videos.`);
    } else {
      console.log("Videos already seeded, skipping.");
    }

    const { rows: existingMaterials } = await client.query("SELECT count(*)::int AS count FROM materials");
    if (existingMaterials[0].count === 0) {
      for (const m of materials) {
        await client.query(
          `INSERT INTO materials (title, category, source_url, page_count) VALUES ($1,$2,$3,$4)`,
          [m.title, m.category, m.sourceUrl, m.pageCount],
        );
      }
      console.log(`Seeded ${materials.length} materials.`);
    } else {
      console.log("Materials already seeded, skipping.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main();
