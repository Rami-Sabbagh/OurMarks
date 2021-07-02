
# OurMarks

[![CodeFactor](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/badge/master)](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/overview/master)
[![License](https://badgen.net/npm/license/ourmarks)][ourmarks npm]
[![NPM](https://badgen.net/npm/v/ourmarks)][ourmarks npm]
[![Dependency Count](https://badgen.net/bundlephobia/dependency-count/ourmarks)][ourmarks bundlephobia]
[![Minzipped Size](https://badgen.net/bundlephobia/minzip/ourmarks)](https://bundlephobia.com/package/ourmarks)
[![Tree Shaking](https://badgen.net/bundlephobia/tree-shaking/ourmarks)][ourmarks bundlephobia]
[![Twitter](https://badgen.net/twitter/follow/rami_sab07)](https://twitter.com/rami_sab07)

A module for extracting exams marks from official PDFs, for the Faculty of Information Technology Engineering at Damascus University

## Introduction

Students exams marks at the Faculty of Information Technology Engineering at Damascus University are published as PDF documents of excel tables.

The PDF documents doesn't allow the exams marks to be used in excel sheets and other programs, because they're only made to be displayed.

That's why the OurMarks module was created, the module extracts the marks records from the PDF documents into structured data items that can be exported as CSV tables, and used for any computational purposes.

This opens the opportunity for:

- Building a structured database of the student's marks.
- Creating applications for displaying the marks.
- Doing statistical data analysis on the marks.
- Building profiles for students.
- And much more...

## Features

> TODO: Fill this section.

## Example

### Node.js (TypeScript)

```ts
import * as fs from 'fs';
import * as path from 'path';

import { loadAndExtractMarksFromDocument } from 'ourmarks';

// Read the document's data
const TARGET_DOCUMENT = path.resolve(__dirname, './documents/1617010032_programming 3 -2-f1-2021.pdf');
const documentData = fs.readFileSync(TARGET_DOCUMENT);

// Parse the marks
async function main() {
    const marksRecords = await loadAndExtractMarksFromDocument(documentData);
    console.log(marksRecords);
}

// Run the asynchronous function
main().catch(console.error);
```

## Getting Started

### Installation

```bash
npm install ourmarks
```

or

```bash
yarn add ourmarks
```

### Basic Usage

The module provides a top-level, simple, direct to use, asynchronous function for extracting marks from PDF files:

```ts
import { loadAndExtractMarksFromDocument } from 'ourmarks';

const marksRecords = loadAndExtractMarksFromDocument(rawPDFBinaryData);
```

> `rawPDFBinaryData` can be a Node.js `Buffer` object, a url to the document, a `Uint8Array` and multiple other options as provided by [PDF.js]

## API Documentation

In addition to the top-level `loadAndExtractMarksFromDocument` function, there are a bunch of other lower-level functions for advanced users.

It's completely unnecessary to use them, but if you want to play around with how the module internally works, you can check the documentation [here][apidocs] and read the 'how it works' section below.

## How it works

> TODO: Fill this section.

[PDF.js]: https://mozilla.github.io/pdf.js/
[Node.js]: https://nodejs.org/en/
[apidocs]: https://rami-sabbagh.github.io/OurMarks/
[ourmarks npm]: https://www.npmjs.com/package/ourmarks
[ourmarks bundlephobia]: https://bundlephobia.com/package/ourmarks
