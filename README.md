
# OurMarks

[![Codecov](https://codecov.io/gh/Rami-Sabbagh/OurMarks/branch/master/graph/badge.svg?token=5VYTRPESUE)](https://codecov.io/gh/Rami-Sabbagh/OurMarks)
[![CodeFactor](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/badge/master)](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/overview/master)
[![Checks](https://badgen.net/github/checks/Rami-Sabbagh/OurMarks)](https://github.com/Rami-Sabbagh/OurMarks/actions)
[![License](https://badgen.net/npm/license/ourmarks)](https://github.com/Rami-Sabbagh/OurMarks/blob/master/LICENSE)
[![NPM](https://badgen.net/npm/v/ourmarks)][ourmarks npm]
[![Minzipped Size](https://badgen.net/bundlephobia/minzip/ourmarks)](https://bundlephobia.com/package/ourmarks)
[![Tree Shaking](https://badgen.net/bundlephobia/tree-shaking/ourmarks)][ourmarks bundlephobia]
[![Twitter](https://badgen.net/twitter/follow/rami_sab07)](https://twitter.com/rami_sab07)

A module for extracting exams marks from official PDFs, for the Faculty of Information Technology Engineering at Damascus University

![A marks document parsed using the module and viewed using Google sheets](https://github.com/Rami-Sabbagh/OurMarks/raw/f4e6353c17316638af21de1c0802c5700a42be67/images/overview.png)

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

- Top-Level API made simple for direct usage
- Written in TypeScript, and so type definitions and IDE auto-complete through VS Code and other IDEs are available
- Well documented and available on [npm][ourmarks npm]
- Supports [Node.js] and the browser
- Introduces no side-effects

## Example

### Node.js (TypeScript)

```ts
import * as fs from 'fs';
import * as path from 'path';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { extractMarksFromDocument } from 'ourmarks';

// Read the document's data
const TARGET_DOCUMENT = path.resolve(__dirname, './documents/1617010032_programming 3 -2-f1-2021.pdf');
const documentData = fs.readFileSync(TARGET_DOCUMENT);

// Parse the marks
async function main() {
    const document = await getDocument(documentData).promise;
    const marksRecords = await extractMarksFromDocument(document);
    document.destroy();

    console.log(marksRecords);
}

// Run the asynchronous function
main().catch(console.error);
```

## Getting Started

### Installation

```bash
npm install ourmarks pdfjs-dist
```

or

```bash
yarn add ourmarks pdfjs-dist
```

### Basic Usage

The module provides 2 top-level asynchronous functions for extracting marks from PDF documents.

It's expected to have the document loaded using PDF.js first, which is very simple:

```ts
import { getDocument } from 'pdfjs-dist';

// Inside your main asynchronous function
async function main() {
    const document = await getDocument(rawPDFBinaryData).promise;

    // ...

    // Don't forget to destroy the document inorder to free the resources allocated.
    document.destroy();
}

// Run the asynchronous function
main().catch(console.error);
```

> On `node.js` you have to import `pdfjs-dist/legacy/build/pdf` instead due to compatibility reasons.

> `rawPDFBinaryData` can be a Node.js `Buffer` object, a url to the document, a `Uint8Array` and multiple other options as provided by [PDF.js]

Then the whole document can be processed at once using `extractMarksFromDocument`:

```ts
import { extractMarksFromDocument } from 'ourmarks';

// Inside the main() function defined earlier:
const marksRecords = await extractMarksFromDocument(document);
```

Or it can be processed page by page using `extractMarksFromPage`:

```ts
import { extractMarksFromPage, MarkRecord } from 'ourmarks';

const wholeRecords: MarkRecord[] = [];

// Inside the main() function defined earlier:
for (let i = 1; i <= document.numPages; i++) {
    const page = await document.getPage(i);
    const pageRecords = await extractMarksFromPage(page);

    wholeRecords.push(...pageRecords);
}
```

## API Documentation

In addition to the top-level `extractMarksFromDocument` and `extractMarksFromPage` functions, there are a bunch of other lower-level functions for advanced users.

It's completely unnecessary to use them, but if you want to play around with how the module internally works, you can check the [api documentation][apidocs] and read the 'how it works' section below.

## How it works

The marks extractor works through a list of 7 steps:

### Step 01: Load the document for parsing

The PDF document is loaded using the `PDF.js` library so it can be parsed.

Once the document has been loaded, it's possible to load each of its pages.

### Step 02: Load each page in the document

Each page in the document is loaded.

Once a page is loaded, it's possible to read its content for processing.

### Step 03: Get the text items of each page

For each page, a list of all the text items in it is created.

Each text item has the following data structure:

| Field Name    | Type                    | Description                                                                    |
|---------------|-------------------------|--------------------------------------------------------------------------------|
| string        | `string`                | The content of the item                                                        |
| direction     | `'ttb'` `'ltr'` `'rtl'` | The direction of the item's content                                            |
| width         | `number`                | The width of the item, in document units                                       |
| height        | `number`                | The height of the item, in document units                                      |
| tranform      | `number[]`              | The 3x3 transformation matrix of the item, with only 6 values stored           |
| tranform`[0]` | `number`                | The (0,0) value in the item's tranformation matrix, represents **scale x**     |
| tranform`[1]` | `number`                | The (1,0) value in the item's tranformation matrix, represents **skew**        |
| tranform`[2]` | `number`                | The (0,1) value in the item's tranformation matrix, represents **skew**        |
| tranform`[3]` | `number`                | The (1,1) value in the item's tranformation matrix, represents **scale y**     |
| tranform`[4]` | `number`                | The (0,2) value in the item's tranformation matrix, represents **translate x** |
| tranform`[5]` | `number`                | The (1,2) value in the item's tranformation matrix, represents **translate y** |

### Step 04: Filter and simplify the text items

With the text items stored in a list, the loaded PDF document can be discarded safely as it's no longer needed.

The items list is filtered from:

- Items with `ttb` direction, we're only intereseted in English and Arabic items.
- Item with non-zero `tranform[1]` and `tranform[2]`, we're not interested in any items with any rotation/skewing.
- Items with empty `''` content.
- Items with zero `transform[4]` or `tranform[5]`, as they are invisible/invalid.

Then each item is mapped into a more simplified data structure:

> Each item is determined as Arabic if it has `rtl` direction

| Field Name | Type               | Description                                            |
|------------|--------------------|--------------------------------------------------------|
| value      | `string`           | The content of the simplified item                     |
| arabic     | `'true'` `'false'` | Whether the item contains any Arabic characters or not |
| x          | `number`           | The X coordinates of the item, equal to `tranform[4]`  |
| y          | `number`           | The Y coordinates of the item, equal to `tranform[5]`  |
| width      | `number`           | The width of the item                                  |
| height     | `number`           | The height of the item                                 |

### Step 05: Merge close text items

![The original Arabic items](https://github.com/Rami-Sabbagh/OurMarks/raw/f4e6353c17316638af21de1c0802c5700a42be67/images/items_highlighted.png)

It was found that Arabic content is stored as independent text items of each character.

And so the characters has to be merged back into proper items.

![The Arabic items after merging](https://github.com/Rami-Sabbagh/OurMarks/raw/f4e6353c17316638af21de1c0802c5700a42be67/images/items_merged.png)

A simple algorithm was created to solve that, here's an overview:

> Please note that the coordinates in the PDF documents are bottom-left corner based.

1. Sort the list of items in **ascending** order, first by their Y coordinates, then by their X coordinates.
2. For each range in the list with the same Y coordinates do:
    - Iterate over the row's items in left to right order:
        1. Check if the current item should be merged with the previous one:
            - They should match in height.
            - Neither of the items should be protected.
                - An item is considered protected if it's a number of 5 digits (a student id).
            - Define `errorTolerance = currentItem.height / 10`.
            - The condition `currentItem.x <= previousItem.X + previousItem.width + errorTolerance` should be met.
        2. If the items should be merged, do that by:
            - Concatenating their content in the correct direction.
            - Setting the merged item to be Arabic if any of the items were arabic.
            - Calculating the new width of the item using `currentItem.x + currentItem.width - previousItem.x`.

> Please note that the previous item is the item on the left, and the next item is the item on the right.
That's because how the items list was sorted.

### Step 06: Shape the items into a table structure

The text items can be now shaped into a table structure, which is a 2-dimensional list of the items.

The first dimension is for the rows, and the second dimension is for the cells.

1. Sort the list of items in **descending** order, first by their Y coordinates, then by their X coordinates.
    - Items should be considiered they have the same Y coordinates if their Y projections do intersect:
        - `itemA.y >= itemB.y && itemA.y <= itemB.y + itemB.height` or `itemB.y >= itemA.y && itemB.y <= itemA.y + itemA.height`
2. Each range in the list with the same Y coordinates do is a row, with the items (considered as cells) being sorted from left to right.

### Step 07: Extract marks records from the table

Now the simplified text items has been stored in a table structure,
it's possible to iterate over its rows and extract marks records.

Mark records have the following data structure:

| Field Name        | Type              | Description                                                                    |
|-------------------|-------------------|--------------------------------------------------------------------------------|
| studentId         | `number`          | The exam ID of the student, a 5 digits number                                  |
| studentName       | `string` / `null` | The full name of the student, may contain his father's name in some situations |
| studentFatherName | `string` / `null` | The name of the student's father when not included in the full name            |
| practicalMark     | `number` / `null` | The practical mark of the exam, usually out of 20 or 30                        |
| theoreticalMark   | `number` / `null` | The theoretical mark of the exam, usually out of 80 or 70                      |
| examMark          | `number` / `null` | The total mark of the exam, should be out of 100                               |

> All the fields (except the `studentId`) can be `null` because they might be missing from the table, or malformed with other values.

The marks records are extracted using the following algorithm:

- For each row in the table that starts with a 5 digits number:
    1. The `studentId` is that item.
    2. Create a list for storing marks.
    3. Iterate over the rest of items in the row:
        1. Skip items with length over 255 characters.
        2. The item is considered a _mark_ if it's a number of 1 to 3 digits, and not detected as Arabic.
        3. If the item is Arabic and the marks list is empty:
            - If `studentName` is `null`, then set it to the item.
            - If `studentFatherName` is `null` then set it to the item.
        4. If the item is considered a _mark_, and the marks list has less than 3 items, then push the item to the list.
    4. If there's 1 item in the marks list, then give it to `examMark`.
    5. Else if there's 3 items in the marks list, then give them to `practicalMark`, `theoreticalMark` and `examMark` in this order.

[PDF.js]: https://mozilla.github.io/pdf.js/
[Node.js]: https://nodejs.org/en/
[apidocs]: https://rami-sabbagh.github.io/OurMarks/
[ourmarks npm]: https://www.npmjs.com/package/ourmarks
[ourmarks bundlephobia]: https://bundlephobia.com/package/ourmarks
