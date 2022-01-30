import * as fs from 'fs';
import * as path from 'path';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { extractMarksFromDocument, MarkRecord } from '../src';

const documentsPath = path.resolve(__dirname, '../documents');

const documentsNames: string[] = [];
const documentsData: Record<string, Buffer> = {};
const documents: Record<string, PDFDocumentProxy> = {};

/**
 * Reads the documents files and stores them in memory.
 */
function readDocuments() {
	fs.readdirSync(documentsPath).forEach((documentName) => {
		const documentPath = path.join(documentsPath, documentName);
		const documentData = fs.readFileSync(documentPath);

		documentsNames.push(documentName);
		documentsData[documentName] = documentData;
	});
}

/**
 * Loads the documents from memory, as PDF.js documents.
 */
async function loadDocuments() {
	for (const documentName of documentsNames) {
		const documentData = documentsData[documentName];

		const document = await getDocument({
			data: documentData,
			useSystemFonts: true,
		}).promise;
		documents[documentName] = document;
	}
}

/**
 * Disposes the loaded PDF.js documents from memory.
 */
async function unloadDocuments() {
	for (const documentName of documentsNames) {
		documents[documentName].destroy();
		delete documents[documentName];
	}
}

/**
 * Compares two marks records by comparing their students ids.
 */
function compareRecords(a: MarkRecord, b: MarkRecord): number {
	return a.studentId - b.studentId;
}

type FlatMarkRecord = (number | string | null)[];

/**
 * Converts the marks records from object structures to a 1d array structures.
 * @param records The records to flatten.
 * @returns The flattened records.
 */
function flattenRecords(records: MarkRecord[]): FlatMarkRecord[] {
	return records.map((record) => [
		record.studentId,
		record.studentName,
		record.studentFatherName,
		record.practicalMark,
		record.theoreticalMark,
		record.examMark,
	]);
}

// Read all the documents files.
readDocuments();

// The documents should be loaded before running the tests.
beforeAll(async () => {
	await loadDocuments();
});

// The documents better be disposed after running the tests, just to be polite with the interpreter.
afterAll(async () => {
	await unloadDocuments();
});

test.each(documentsNames)('Extract marks from %s', async (documentName) => {
	const document = documents[documentName];
	const records = await extractMarksFromDocument(document);

	// Sort the records so the results can be more deterministic.
	records.sort(compareRecords);

	// Flatten the records to result with smaller size Jest snapshot files.
	const flatRecords = flattenRecords(records);

	// Expect the parsed records to stay the same.
	// while this test is not really useful to check if the module output is valid while initially creating it.
	// it's usefull to keep checking that the module is still working properly as it used to before.
	expect(flatRecords).toMatchSnapshot('Sorted extracted records');

	// Give each document 5 seconds to be processed.
}, 5_000);
