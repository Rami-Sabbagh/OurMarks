import * as path from 'path';
import * as fs from 'fs';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { PDFDocument, rgb } from 'pdf-lib';

import { mergeCloseSimpleTextItems, parseTextItems, simplifyTextItems } from './lib/utils';

const TARGET_DIRECTORY = path.resolve(__dirname, '../documents');
const OUTPUT_DIRECTORY = path.resolve(__dirname, '../out/text_items_outlined');

async function outlineDocument(sourceDocumentPath: string, outputDocumentPath: string): Promise<void> {
	// Read the original PDF data.
	console.info('- Reading original PDF file...');
	const documentData = await fs.promises.readFile(sourceDocumentPath);

	// Load it as PDF.js and PDF-Lib documents.
	console.info('- Loading the original PDF file...');
	const pdfJSDocument = await getDocument(documentData).promise;
	const pdfLibDocument = await PDFDocument.load(documentData);

	// Create the output PDF-Lib document.
	console.info('- Creating the output document...');
	const outputDocument = await PDFDocument.create();

	// The numbers of pages we're targetting (the whole document) (zero-based).
	const targetPages = [];
	const pagesCount = pdfLibDocument.getPageCount();
	for (let i = 0; i < pagesCount; i++) targetPages.push(i);

	// Copy the original pages into the output PDF-Lib document.
	console.info('- Copying the pages into the output document...');
	const pdfLibPages = await outputDocument.copyPages(pdfLibDocument, targetPages);
	pdfLibPages.forEach((page) => outputDocument.addPage(page));

	// Process each page in the document.
	console.info('- Processing pages...');
	for (let i = 0; i < pagesCount; i++) {
		console.log(`Processing page ${i+1}/${pagesCount}`);

		// Load the pages.
		const pdfLibPage = pdfLibPages[i];
		const pdfJSPage = await pdfJSDocument.getPage(i + 1);

		// Parse the text items and simplify them.
		const textItems = await parseTextItems(pdfJSPage);
		const simplifiedTextItems = simplifyTextItems(textItems);
		const mergedTextItems = mergeCloseSimpleTextItems(simplifiedTextItems);

		// Outline each text item.
		mergedTextItems.forEach((item) => {
			pdfLibPage.drawRectangle({
				x: item.x,
				y: item.y,
				width: item.width,
				height: item.height,
				borderColor: item.arabic === 'true' ? rgb(1, 0, 0) : rgb(0, 0, 1),
				borderWidth: item.height / 10,
			});
		});
	}

	console.info('- Encoding output document...')
	const outputData = await outputDocument.save();

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
		const outputDocumentPath = path.join(OUTPUT_DIRECTORY, documentName);

		await outlineDocument(sourceDocumentPath, outputDocumentPath);
		console.info();
	}
}

main().catch(console.error);
