/* Import external libraries */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/display/api';

/* Import structures */
import { MarkRecord } from './mark-record';

/* Import functions */
import { getTextItems } from './document-parser';
import { mergeCloseSimpleTextItems } from './items-merger';
import { groupIntoRows } from './items-shaper';
import { filterAndSimplifyTextItems } from './items-simplifier';
import { extractMarksFromItemsTable } from './marks-extractor';

/* The high-level, direct to use API */

/**
 * Extracts marks records from a loaded PDF page.
 *
 * @param page The target PDF page.
 * @returns The extracted marks records.
 */
export async function extractMarksFromPage(page: PDFPageProxy): Promise<MarkRecord[]> {
    const textItems = await getTextItems(page);
    const simplifiedTextItems = filterAndSimplifyTextItems(textItems);
    const mergedTextItems = mergeCloseSimpleTextItems(simplifiedTextItems);
    const itemsTable = groupIntoRows(mergedTextItems);
    const marksRecords = extractMarksFromItemsTable(itemsTable);

    return marksRecords;
}

/**
 * Extracts marks records from a loaded PDF document.
 *
 * @param document The target PDF document.
 * @returns The extracted marks records.
 */
export async function extractMarksFromDocument(document: PDFDocumentProxy): Promise<MarkRecord[]> {
    const marksRecords: MarkRecord[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const pageMarksRecords = await extractMarksFromPage(page);
        marksRecords.push(...pageMarksRecords);
    }

    return marksRecords;
}

/**
 * Loads a PDF document and extracts the marks records from it.
 * 
 * @param src Can be a URL where a PDF file is located, a typed array (Uint8Array)
 *              already populated with data, or a parameter object.
 * @returns The extracted marks records.
 */
export async function loadAndExtractMarksFromDocument(src: Parameters<typeof getDocument>[0]): Promise<MarkRecord[]> {
    const document = await getDocument(src).promise;
    const marksRecords = extractMarksFromDocument(document);
    document.destroy();

    return marksRecords;
}

/* Export the structures */

export { SimpleTextItem } from './simple-text-item';
export { MarkRecord } from './mark-record';

/* Export the advanced functions for manually processing a document */

export { getTextItems } from './document-parser';
export { simplifyTextItem, filterAndSimplifyTextItems } from './items-simplifier';
export { mergeCloseSimpleTextItems } from './items-merger';
export { groupIntoRows } from './items-shaper';
export { extractMarksFromItemsTable } from './marks-extractor';