/* Import external libraries */
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

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
 * Specify additional options for the extraction process.
 */
export interface ExtractionOptions {
	/**
	 * Whether to merge close items together or not (defaults to `false` as of v3.0.0).
	 */
	mergeItems?: boolean;
}

/**
 * Extracts marks records from a loaded PDF page.
 *
 * @param page The target PDF page.
 * @param options Additional options for the extraction process. (for example to enable back the merging functionality)
 * @returns The extracted marks records.
 */
export async function extractMarksFromPage(page: PDFPageProxy, options?: ExtractionOptions): Promise<MarkRecord[]> {
	const textItems = await getTextItems(page);
	const simplifiedTextItems = filterAndSimplifyTextItems(textItems);
	const mergedTextItems = options?.mergeItems ? mergeCloseSimpleTextItems(simplifiedTextItems) : [...simplifiedTextItems];
	const itemsTable = groupIntoRows(mergedTextItems);
	const marksRecords = extractMarksFromItemsTable(itemsTable);

	return marksRecords;
}

/**
 * Extracts marks records from a loaded PDF document.
 *
 * @param document The target PDF document.
 * @param options Additional options for the extraction process. (for example to enable back the merging functionality)
 * @returns The extracted marks records.
 */
export async function extractMarksFromDocument(document: PDFDocumentProxy, options?: ExtractionOptions): Promise<MarkRecord[]> {
	const marksRecords: MarkRecord[] = [];

	for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
		const page = await document.getPage(pageNumber);
		const pageMarksRecords = await extractMarksFromPage(page, options);
		marksRecords.push(...pageMarksRecords);
	}

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