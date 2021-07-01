import * as path from 'path';
import * as fs from 'fs';

import stringify from 'csv-stringify/lib/sync';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { parseTextItems, simplifyTextItems, mergeCloseSimpleTextItems, groupIntoRows, extractMarks, MarkRecord } from './lib/utils';

const TARGET_DIRECTORY = path.resolve(__dirname, '../documents');
const OUTPUT_FILE = path.resolve(__dirname, '../out/semester_marks.csv');

const studentsIds = new Set<number>(); // studentsIds = [studentId, ...]
const studentsNames: Record<number, string | undefined> = []; // studentsNames[studentId] = studentName
const studentsFatherNames: Record<number, string | undefined> = []; // studentsFatherNames[studentId] = studentFatherName

const subjectsNames = new Set<string>(); // subjectsNames = [subjectName, ...]
const subjectsMarks: Record<string, Record<number, number | undefined>> = {}; // subjectMarks[subjectName][studentId] = examMark

async function loadSubject(documentPath: string) {
	const documentFileName = path.basename(documentPath);
	const subjectName = documentFileName.replace(/.pdf$/, '');

	// Read the original PDF data.
	console.info('- Reading subject PDF file...');
	const documentData = await fs.promises.readFile(documentPath);

	// Load it as PDF.js documents.
	console.info('- Loading the subject PDF file...');
	const pdfJSDocument = await getDocument(documentData).promise;
	const pagesCount = pdfJSDocument.numPages;

	const subjectRecords: MarkRecord[] = [];

	// Process each page in the document.
	console.info('- Processing pages...');
	for (let i = 0; i < pagesCount; i++) {
		console.log(`Processing page ${i + 1}/${pagesCount}`);

		// Load the pages.
		const page = await pdfJSDocument.getPage(i + 1);

		// Parse the text items and simplify them.
		const textItems = await parseTextItems(page);
		const simplifiedTextItems = simplifyTextItems(textItems);
		const mergedTextItems = mergeCloseSimpleTextItems(simplifiedTextItems);
		const itemsTable = groupIntoRows(mergedTextItems);
		const pageMarksRecords = extractMarks(itemsTable);

		// Add the page marks into the whole document marks.
		subjectRecords.push(...pageMarksRecords);
	}

	subjectsNames.add(subjectName);
	subjectsMarks[subjectName] = {};

	subjectRecords.forEach((record) => {
		const { studentId, studentName, studentFatherName, examMark } = record;

		studentsIds.add(studentId);

		if (studentName !== null && studentName.length > (studentsNames[studentId] ?? '').length)
			studentsNames[studentId] = studentName;
		if (studentFatherName !== null && studentFatherName.length > (studentsFatherNames[studentId] ?? '').length)
			studentsFatherNames[studentId] = studentFatherName;
		if (examMark !== null)
			subjectsMarks[subjectName][studentId] = examMark;
	});

	console.info('- Loaded subject document successfully ✔');
	pdfJSDocument.destroy();
}

function createSemesterTableCSV(): string {
	const content: (string | number | null)[][] = [];

	studentsIds.forEach((studentId) => {
		const row = [studentId, studentsNames[studentId] || null, studentsFatherNames[studentId] || null];
		subjectsNames.forEach((subjectName) => row.push(subjectsMarks[subjectName][studentId] || 0));
		content.push(row);
	});

	const csvData = stringify(content, {
		header: true,
		columns: ['id', 'name', 'father', ...Array.from(subjectsNames.values())],
		quoted_string: true,
	});

	return csvData;
}

async function main() {
	await fs.promises.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
	const documentsNames = await fs.promises.readdir(TARGET_DIRECTORY);

	// Load subjects
	for (let documentName of documentsNames) {
		console.info(`===---( ${documentName} )---===`);
		console.info();

		const documentPath = path.join(TARGET_DIRECTORY, documentName);

		await loadSubject(documentPath);
		console.info();
	}

	console.info('===---( Output Table )---===');
	console.info();

	console.info('- Creating and encoding table...');
	const csvData = createSemesterTableCSV();
	console.info('- Writing table...');
	await fs.promises.writeFile(OUTPUT_FILE, csvData);

	console.info();
	console.info('Generated the semester marks table successfully ✔');
}

main().catch(console.error);
