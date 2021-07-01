import { PDFPageProxy, TextItem } from "pdfjs-dist/types/display/api";

/**
 * Gets the text items in a PDF page.
 * @param page The target PDF page.
 * @returns The text items of the page.
 */
async function getTextItems(page: PDFPageProxy): Promise<TextItem[]> {
    // Marked text items are not enabled in the getTextContent parameters.
	const textContent = await page.getTextContent();
	// And so we're sure that all the items are TextItem.
	return textContent.items as TextItem[];
}
