import * as path from 'path';
import * as fs from 'fs';

import stringify from 'csv-stringify/lib/sync';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { parseTextItems, simplifyTextItems, mergeCloseSimpleTextItems, groupIntoRows, extractMarks, MarkRecord } from './lib/utils';

const TARGET_DIRECTORY = path.resolve(__dirname, '../documents');
const OUTPUT_DIRECTORY = path.resolve(__dirname, '../out/marks_exracted');

async function outlineDocument(sourceDocumentPath: string, outputDocumentPath: string): Promise<void> {
	// Read the original PDF data.
	console.info('- Reading original PDF file...');
	const documentData = await fs.promises.readFile(sourceDocumentPath);

	// Load it as PDF.js and PDF-Lib documents.
	console.info('- Loading the original PDF file...');
	const pdfJSDocument = await getDocument(documentData).promise;
	const pagesCount = pdfJSDocument.numPages;

	const marksRecords: MarkRecord[] = [];

	// Process each page in the document.
	console.info('- Processing pages...');
	for (let i = 0; i < pagesCount; i++) {
		console.log(`Processing page ${i+1}/${pagesCount}`);

		// Load the pages.
		const page = await pdfJSDocument.getPage(i + 1);

		// Parse the text items and simplify them.
		const textItems = await parseTextItems(page);
		const simplifiedTextItems = simplifyTextItems(textItems);
		const mergedTextItems = mergeCloseSimpleTextItems(simplifiedTextItems);
		const itemsTable = groupIntoRows(mergedTextItems);
		const pageMarksRecords = extractMarks(itemsTable);

		// Add the page marks into the whole document marks.
		marksRecords.push(...pageMarksRecords);
	}

	console.info('- Encoding output document...')
	const flattenedMarksRecords = marksRecords.map((record) => [record.studentId, record.studentName, record.studentFatherName, record.practicalMark, record.theoreticalMark, record.examMark]);
	const outputData = stringify(flattenedMarksRecords, {
		header: true,
		columns: ['id', 'name', 'father', 'practical', 'theoretical', 'total'],
		quoted_string: true,
	});

	console.info('- Writing output document...');
	await fs.promises.writeFile(outputDocumentPath, outputData);

	console.info('- Outlined document successfully ✔');
	pdfJSDocument.destroy();
}

async function main() {

	await fs.promises.mkdir(OUTPUT_DIRECTORY, { recursive: true });
	const documentsNames = await fs.promises.readdir(TARGET_DIRECTORY);

	for (let documentName of documentsNames) {
		console.info(`===---( ${documentName} )---===`);
		console.info();

		const sourceDocumentPath = path.join(TARGET_DIRECTORY, documentName);
		const outputDocumentPath = path.join(OUTPUT_DIRECTORY, documentName.replace(/.pdf$/, '.csv'));

		await outlineDocument(sourceDocumentPath, outputDocumentPath);
		console.info();
	}
}

main().catch(console.error);
