import * as path from 'path';
import * as fs from 'fs';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { getTextItems, filterAndSimplifyTextItems, mergeCloseSimpleTextItems, groupIntoRows } from '../src';

const TARGET_DIRECTORY = path.resolve(__dirname, '../documents');
const OUTPUT_DIRECTORY = path.resolve(__dirname, '../out');

async function processDocument(sourcePath: string, destinationPath: string) {
	console.info('- Reading the original PDF file...');
	const documentData = await fs.promises.readFile(sourcePath);

	console.info('- Loading the original PDF document...');
	const pdfJSDocument = await getDocument(documentData).promise;
	const pdfLibDocument = await PDFDocument.load(documentData);

	console.info('- Creating output PDF document...');
	const outputDocument = await PDFDocument.create();
	const annotationFont = await outputDocument.embedFont(StandardFonts.TimesRomanBold);

	const targetPages: number[] = [];
	const pagesCount = pdfLibDocument.getPageCount();
	for (let i = 0; i < pagesCount; i++) targetPages.push(i, i);

	console.info('- Copying the pages into the output document...');
	/**
	 * Pages with odd-numbered indexes have the text items non-merged (before applying items-shaper).
	 * Pages with even-numbered indexes have the text items merged (after applying items-shaper).
	 */
	const pdfLibPages = await outputDocument.copyPages(pdfLibDocument, targetPages);
	pdfLibPages.forEach((page) => outputDocument.addPage(page));

	console.info('- Processing pages...');
	for (let i = 0; i < pagesCount; i++) {
		console.log(`Processing page ${i + 1}/${pagesCount}`);

		// Load the pages.
		const oddPage = pdfLibPages[i * 2];
		const evenPage = pdfLibPages[i * 2 + 1];
		const pdfJSPage = await pdfJSDocument.getPage(i + 1);

		const annotationPadding = 10;
		const annotationSize = 20;
		const annotationHeight = annotationFont.heightAtSize(annotationSize);

		oddPage.drawRectangle({
			x: 0,
			y: 0,
			width: 3,
			height: 3,
			color: rgb(0, 1, 0),
			borderColor: rgb(0, 1, 0),
			borderWidth: 1,
		});

		oddPage.setFont(annotationFont);
		oddPage.moveTo(annotationPadding, oddPage.getHeight() - annotationHeight - annotationPadding);
		oddPage.drawText('OurMarks: Unmerged text items', { size: annotationSize, color: rgb(0, 0, 1) });

		evenPage.setFont(annotationFont);
		evenPage.moveTo(annotationPadding, oddPage.getHeight() - annotationHeight - annotationPadding);
		evenPage.drawText('OurMarks: Merged text items', { size: annotationSize, color: rgb(1, 0, 0) });

		// Parse the text items and simplify them.
		const textItems = await getTextItems(pdfJSPage);
		const simplifiedTextItems = filterAndSimplifyTextItems(textItems);
		const mergedTextItems = mergeCloseSimpleTextItems(simplifiedTextItems);
		const itemsTable = groupIntoRows(mergedTextItems);

		// Outline each text item
		simplifiedTextItems.forEach((item) => {
			oddPage.drawRectangle({
				x: item.x,
				y: item.y,
				width: item.width,
				height: item.height,
				borderColor: item.arabic === 'true' ? rgb(1, 0, 0) : rgb(0, 0, 1),
				borderWidth: item.height / 10,
			});
		});

		// Outline each table row with a padding
		const rowPadding = 1;
		itemsTable.forEach((row) => {
			const firstItem = row[row.length - 1];
			const lastItem = row[0];

			let minY = firstItem.y;
			let maxY = firstItem.y + firstItem.height;

			row.forEach((item) => {
				minY = Math.min(minY, item.y);
				maxY = Math.max(maxY, item.y + item.height);
			});

			evenPage.drawRectangle({
				x: firstItem.x - rowPadding,
				y: minY - rowPadding,
				width: lastItem.x + lastItem.width - firstItem.x + rowPadding * 2,
				height: maxY - minY + rowPadding * 2,
				color: rgb(252 / 255, 98 / 255, 3 / 255),
				opacity: 0.15,
			});
		});

		// Outline each text item.
		mergedTextItems.forEach((item) => {
			evenPage.drawRectangle({
				x: item.x,
				y: item.y,
				width: item.width,
				height: item.height,
				borderColor: item.arabic === 'true' ? rgb(1, 0, 0) : rgb(0, 0, 1),
				borderWidth: item.height / 10,
			});
		});
	}

	console.info('- Encoding the output PDF document...');
	const outputData = await outputDocument.save();

	console.info('- Writing the output PDF file...');
	await fs.promises.writeFile(destinationPath, outputData);

	console.info('- Visualized document items successfully ✔');
	pdfJSDocument.destroy();
}

(async () => {
	await fs.promises.mkdir(OUTPUT_DIRECTORY, { recursive: true });
	const documentsNames = await fs.promises.readdir(TARGET_DIRECTORY);

	for (const documentName of documentsNames) {
		console.info(`===---( ${documentName} )---===`);
		console.info();

		const sourcePath = path.join(TARGET_DIRECTORY, documentName);
		const destinationPath = path.join(OUTPUT_DIRECTORY, documentName);

		await processDocument(sourcePath, destinationPath);
		console.info();
	}
})().catch(console.error);