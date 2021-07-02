
# OurMarks

[![CodeFactor](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/badge/master)](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/overview/master)

A module for extracting exams marks from official PDFs, for the Faculty of Information Technology Engineering at Damascus University

## Introduction

Students exams marks at the Faculty of Information Technology Engineering at Damascus University are published as PDF documents of excel tables.

The PDF documents doesn't allow the exams marks to be used in excel sheets and other programs, because they're only made to be displayed.

That's why the OurMarks module was created, the module extracts the marks records from the PDF documents into structured data items that can be exported as CSV tables, and used for any computational purposes.

This opens the possibility for:

- Building a structured database of the student's marks.
- Creating applications for displaying the marks.
- Doing statistical data analysis on the marks.
- Building profiles for students.
- And much more...

## Features

> TODO: Fill this section.

## Example

### Node.js

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

### Usage

## API Documentation

> TODO: Fill this section.

## How it works

> TODO: Fill this section.
