
# OurMarks

[![CodeFactor](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/badge/master)](https://www.codefactor.io/repository/github/rami-sabbagh/ourmarks/overview/master)

A module for extracting exams marks from official PDFs, for the Faculty of Information Technology Engineering at Damascus University

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
