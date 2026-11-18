// Regenerates the committed upload fixtures. Run from the repo root:
//   node tests/fixtures/generate-fixtures.mjs
//
// The fixtures are deliberately small. `encrypted.pdf` is hand-built because
// pdf-lib cannot write encrypted PDFs; it uses the PDF 1.4 standard security
// handler (V=1, R=2, 40-bit RC4) with user password "secret" and owner
// password "owner".
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(here, "uploads");

const STAMP = new Date("2024-01-01T00:00:00.000Z");

const DOCX_MAIN =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const PPTX_MAIN =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml";
const SLIDE_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
const RELS_TYPE =
  "application/vnd.openxmlformats-package.relationships+xml";
const OFFICE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function zipFile(zip, name, contents) {
  zip.file(name, contents, { date: STAMP, createFolders: false });
}

function contentTypes(overrides) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="${RELS_TYPE}"/>
  <Default Extension="xml" ContentType="application/xml"/>
${overrides
  .map(
    ([partName, contentType]) =>
      `  <Override PartName="${partName}" ContentType="${contentType}"/>`
  )
  .join("\n")}
</Types>`;
}

async function makeDocx() {
  const zip = new JSZip();

  // file-type reads [Content_Types].xml first; keep it as the first entry.
  zipFile(
    zip,
    "[Content_Types].xml",
    contentTypes([["/word/document.xml", DOCX_MAIN]])
  );

  zipFile(
    zip,
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="${OFFICE_REL}/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zipFile(
    zip,
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Section one covers cell structure and mitosis.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Cells divide to make more cells.</w:t></w:r></w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:r><w:t>Section two covers photosynthesis.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Plants convert light into chemical energy.</w:t></w:r></w:p>
    <w:sectPr/>
  </w:body>
</w:document>`
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

async function makePptx() {
  const zip = new JSZip();

  zipFile(
    zip,
    "[Content_Types].xml",
    contentTypes([
      ["/ppt/presentation.xml", PPTX_MAIN],
      ["/ppt/slides/slide1.xml", SLIDE_TYPE],
      ["/ppt/slides/slide2.xml", SLIDE_TYPE],
      ["/ppt/slides/slide3.xml", SLIDE_TYPE],
    ])
  );

  zipFile(
    zip,
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="${OFFICE_REL}/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  zipFile(
    zip,
    "ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                xmlns:r="${OFFICE_REL}">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
  </p:sldIdLst>
</p:presentation>`
  );

  zipFile(
    zip,
    "ppt/_rels/presentation.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="${OFFICE_REL}/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="${OFFICE_REL}/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId4" Type="${OFFICE_REL}/slide" Target="slides/slide3.xml"/>
</Relationships>`
  );

  const slides = [
    ["1", "Slide one: the water cycle", "Evaporation moves water into the air."],
    ["2", "Slide two: condensation", "Water vapour cools and forms clouds."],
    ["3", "Slide three: precipitation", "Rain and snow return water to the ground."],
  ];

  for (const [number, title, body] of slides) {
    zipFile(
      zip,
      `ppt/slides/slide${number}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>${title}</a:t></a:r></a:p>
          <a:p><a:r><a:t>${body}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
    );
  }

  return zip.generateAsync({ type: "nodebuffer" });
}

async function makeTextPdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const pageOne = pdf.addPage([595, 842]);
  pageOne.drawText("Page one: the mitochondrion is the powerhouse of the cell.", {
    x: 48,
    y: 760,
    size: 14,
    font,
  });
  pageOne.drawText("It produces ATP through cellular respiration.", {
    x: 48,
    y: 736,
    size: 14,
    font,
  });

  const pageTwo = pdf.addPage([595, 842]);
  pageTwo.drawText("Page two: chloroplasts carry out photosynthesis.", {
    x: 48,
    y: 760,
    size: 14,
    font,
  });

  return Buffer.from(await pdf.save());
}

async function makeScannedPdf() {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  return Buffer.from(await pdf.save());
}

async function makeManyPagePdf(pageCount) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (let index = 1; index <= pageCount; index += 1) {
    const page = pdf.addPage([595, 842]);
    page.drawText(`Page ${index}`, { x: 48, y: 780, size: 12, font });
  }

  return Buffer.from(await pdf.save());
}

// --- Minimal encrypted PDF (standard security handler, V=1, R=2) ------------

const PADDING = Buffer.from([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff,
  0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c,
  0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

function md5(...parts) {
  const hash = createHash("md5");
  for (const part of parts) hash.update(part);
  return hash.digest();
}

function padPassword(password) {
  const raw = Buffer.from(password, "latin1").subarray(0, 32);
  return Buffer.concat([raw, PADDING.subarray(0, 32 - raw.length)]);
}

function rc4(key, data) {
  const state = new Uint8Array(256);
  for (let index = 0; index < 256; index += 1) state[index] = index;

  let j = 0;
  for (let index = 0; index < 256; index += 1) {
    j = (j + state[index] + key[index % key.length]) & 0xff;
    [state[index], state[j]] = [state[j], state[index]];
  }

  const output = Buffer.alloc(data.length);
  let i = 0;
  j = 0;

  for (let index = 0; index < data.length; index += 1) {
    i = (i + 1) & 0xff;
    j = (j + state[i]) & 0xff;
    [state[i], state[j]] = [state[j], state[i]];
    output[index] = data[index] ^ state[(state[i] + state[j]) & 0xff];
  }

  return output;
}

function objectKey(fileKey, objectNumber, generation) {
  const suffix = Buffer.from([
    objectNumber & 0xff,
    (objectNumber >> 8) & 0xff,
    (objectNumber >> 16) & 0xff,
    generation & 0xff,
    (generation >> 8) & 0xff,
  ]);

  return md5(fileKey, suffix).subarray(0, Math.min(fileKey.length + 5, 16));
}

function makeEncryptedPdf() {
  const userPad = padPassword("secret");
  const ownerPad = padPassword("owner");
  const ownerKey = md5(ownerPad).subarray(0, 5);
  const O = rc4(ownerKey, userPad);

  const permissions = -44;
  const permissionBytes = Buffer.alloc(4);
  permissionBytes.writeInt32LE(permissions);

  const fileId = md5(Buffer.from("exammaker-encrypted-fixture"));
  const fileKey = md5(userPad, O, permissionBytes, fileId).subarray(0, 5);
  const U = rc4(fileKey, PADDING);

  const content = Buffer.from(
    "BT\n/F1 24 Tf\n72 700 Td\n(Secret exam text) Tj\nET\n",
    "latin1"
  );
  const encryptedContent = rc4(objectKey(fileKey, 4, 0), content);

  const bodies = {
    1: Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    2: Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"),
    3: Buffer.from(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] " +
        "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
      "latin1"
    ),
    4: Buffer.concat([
      Buffer.from(`<< /Length ${encryptedContent.length} >>\nstream\n`, "latin1"),
      encryptedContent,
      Buffer.from("\nendstream", "latin1"),
    ]),
    5: Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "latin1"
    ),
    6: Buffer.from(
      `<< /Filter /Standard /V 1 /R 2 /O <${O.toString("hex")}> ` +
        `/U <${U.toString("hex")}> /P ${permissions} >>`,
      "latin1"
    ),
  };

  const parts = [
    Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1"),
  ];
  let offset = parts[0].length;
  const offsets = [];

  for (let number = 1; number <= 6; number += 1) {
    offsets[number] = offset;
    const objectBytes = Buffer.concat([
      Buffer.from(`${number} 0 obj\n`, "latin1"),
      bodies[number],
      Buffer.from("\nendobj\n", "latin1"),
    ]);
    parts.push(objectBytes);
    offset += objectBytes.length;
  }

  const xrefOffset = offset;
  let xref = "xref\n0 7\n0000000000 65535 f \n";

  for (let number = 1; number <= 6; number += 1) {
    xref += `${String(offsets[number]).padStart(10, "0")} 00000 n \n`;
  }

  xref +=
    "trailer\n" +
    `<< /Size 7 /Root 1 0 R /Encrypt 6 0 R /ID [<${fileId.toString("hex")}> <${fileId.toString("hex")}>] >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  parts.push(Buffer.from(xref, "latin1"));

  return Buffer.concat(parts);
}

// ---------------------------------------------------------------------------

async function main() {
  await mkdir(outputDir, { recursive: true });

  const fixtures = {
    "text.pdf": await makeTextPdf(),
    "scanned.pdf": await makeScannedPdf(),
    "encrypted.pdf": makeEncryptedPdf(),
    "too-many-pages.pdf": await makeManyPagePdf(151),
    "corrupt.pdf": Buffer.concat([
      Buffer.from("%PDF-1.7\n", "latin1"),
      Buffer.from("this is not a PDF body, only a header followed by garbage"),
    ]),
    "spoofed.pdf": Buffer.from(
      "This plain text file is named .pdf to test magic-byte mismatch detection."
    ),
    "sample.docx": await makeDocx(),
    "sample.pptx": await makePptx(),
    "sample.txt": Buffer.from(
      [
        "Photosynthesis",
        "",
        "Plants use sunlight to turn carbon dioxide and water into glucose.",
        "Oxygen is released as a by-product. The reaction happens in chloroplasts.",
        "",
        "Respiration",
        "",
        "Cells release energy from glucose. This happens in the mitochondria.",
      ].join("\n")
    ),
    "empty.txt": Buffer.alloc(0),
  };

  for (const [name, bytes] of Object.entries(fixtures)) {
    await writeFile(path.join(outputDir, name), bytes);
    console.log(`${name}: ${bytes.length} bytes`);
  }
}

await main();
