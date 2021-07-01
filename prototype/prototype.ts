import * as path from 'path';
import * as fs from 'fs';

import stringify from 'csv-stringify/lib/sync';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { PDFDocumentProxy, PDFPageProxy, TextItem } from 'pdfjs-dist/types/display/api';

import { PDFDocument, rgb } from 'pdf-lib';

import { parseTextItems, simplifyTextItems, mergeCloseSimpleTextItems, groupIntoRows, extractMarks, SimpleTextItem, MarkRecord } from './lib/utils';

async function readTestDocument(): Promise<Buffer> {
	const documentPath = path.resolve(__dirname, '../documents/1617010032_programming 3 -2-f1-2021.pdf');
	const documentData = await fs.promises.readFile(documentPath);

	return documentData;
}

async function loadTestDocument(): Promise<PDFDocumentProxy> {
	const documentData = await readTestDocument();
	const document = await getDocument(documentData).promise;
	return document;
}

async function writeTextItemsCSV(path: string, items: TextItem[]): Promise<void> {
	const flattenedItems = items.map((item) => [item.str, item.dir, item.width, item.height, ...item.transform]);

	const csvFormattedData = stringify(flattenedItems, {
		header: true,
		columns: ['string', 'direction', 'width', 'height', 'a (scale x)', 'b (skew)', 'c (skew)', 'd (scale y)', 'e (translate x)', 'f (translate y)'],
		quoted_string: true,
	});

	await fs.promises.writeFile(path, csvFormattedData);
}

async function writeSimpleTextItemsCSV(path: string, items: SimpleTextItem[]): Promise<void> {
	const flattenedItems = items.map((item) => [item.value, item.arabic, item.x, item.y, item.width, item.height]);

	const csvFormattedData = stringify(flattenedItems, {
		header: true,
		columns: ['value', 'arabic', 'x', 'y', 'width', 'height'],
		quoted_string: true,
	});

	await fs.promises.writeFile(path, csvFormattedData);
}

async function writeSimpleTextItemsPDF(path: string, items: SimpleTextItem[], originalDocument: Buffer, targetPage: number): Promise<void> {
	const document = await PDFDocument.create();
	const original = await PDFDocument.load(await readTestDocument());

	const [page] = await document.copyPages(original, [targetPage]);
	document.addPage(page);
	// const page = document.addPage([width, height]);

	items.forEach((item) => {
		page.drawRectangle({
			x: item.x,
			y: item.y,
			width: item.width,
			height: item.height,
			borderColor: item.arabic === 'true' ? rgb(1,0,0) : rgb(0,0,1),
			borderWidth: item.height / 10,
		});
	});

	const documentData = await document.save();
	await fs.promises.writeFile(path, documentData);
}

async function writeItemsTableCSV(path: string, table: SimpleTextItem[][]): Promise<void> {
	const flattenedTable = table.map((row) => row.map((item) => item.value));

	const csvFormattedData = stringify(flattenedTable, {
		quoted_string: true,
	});

	await fs.promises.writeFile(path, csvFormattedData);
}

async function writeMarksRecordsCSV(path: string, marksRecords: MarkRecord[]): Promise<void> {
	const flattenedItems = marksRecords.map((record) => [record.studentId, record.studentName, record.studentFatherName, record.practicalMark, record.theoreticalMark, record.examMark]);

	const csvFormattedData = stringify(flattenedItems, {
		header: true,
		columns: ['id', 'name', 'father', 'practical', 'theoretical', 'total'],
		quoted_string: true,
	});

	await fs.promises.writeFile(path, csvFormattedData);
}

async function main() {
	const targetPage = 1;

	console.info('- Loading testing document...');
	const document = await loadTestDocument();
	console.log('Pages count:', document.numPages);

	console.info('- Loading first page for testing...');
	const page = await document.getPage(targetPage);
	const pageWidth = page.getViewport().viewBox[2];
	const pageHeight = page.getViewport().viewBox[3];
	console.log('Page dimensions:', pageWidth, 'x', pageHeight);

	console.info('- Parsing text items...');
	const textItems = await parseTextItems(page);
	console.log('Items count:', textItems.length);

	console.info('- Writing level_0.csv...');
	const outputLevel0CSVPath = path.resolve(__dirname, '../out/level_0.csv');
	await writeTextItemsCSV(outputLevel0CSVPath, textItems);

	console.info('- Simplifying text items...');
	const simplifiedTextItems = simplifyTextItems(textItems);

	console.info('- Writing level_1.csv...');
	const outputLevel1CSVPath = path.resolve(__dirname, '../out/level_1.csv');
	await writeSimpleTextItemsCSV(outputLevel1CSVPath, simplifiedTextItems);

	console.info('- Writing level_1.pdf...');
	const outputLevel1PDFPath = path.resolve(__dirname, '../out/level_1.pdf');
	await writeSimpleTextItemsPDF(outputLevel1PDFPath, simplifiedTextItems, await readTestDocument(), targetPage-1);

	console.info('- Merging close text items...');
	const mergedSimpleTextItems = mergeCloseSimpleTextItems(simplifiedTextItems);

	console.info('- Writing level_2.csv...');
	const outputLevel2CSVPath = path.resolve(__dirname, '../out/level_2.csv');
	await writeSimpleTextItemsCSV(outputLevel2CSVPath, mergedSimpleTextItems);

	console.info('- Writing level_2.pdf...');
	const outputLevel2PDFPath = path.resolve(__dirname, '../out/level_2.pdf');
	await writeSimpleTextItemsPDF(outputLevel2PDFPath, mergedSimpleTextItems, await readTestDocument(), targetPage-1);

	console.info('- Groupping into rows...');
	const itemsTable = groupIntoRows(mergedSimpleTextItems);

	console.info('- Writing level_3.csv...');
	const outputLevel3CSVPath = path.resolve(__dirname, '../out/level_3.csv');
	await writeItemsTableCSV(outputLevel3CSVPath, itemsTable);

	console.info('- Extracting marks records...');
	const marksRecords = extractMarks(itemsTable);

	console.info('- Writing level_4.csv...');
	const outputLevel4CSVPath = path.resolve(__dirname, '../out/level_4.csv');
	await writeMarksRecordsCSV(outputLevel4CSVPath, marksRecords);
}

main().then(() => console.info('- Finished successfully')).catch(console.error);
