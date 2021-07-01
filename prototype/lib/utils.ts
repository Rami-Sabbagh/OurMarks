import { PDFPageProxy, TextItem } from 'pdfjs-dist/types/display/api';

export async function parseTextItems(page: PDFPageProxy): Promise<TextItem[]> {
	// Marked text items are not enabled in the getTextContent parameters.
	const textContent = await page.getTextContent();
	// And so we're sure that all the items are TextItem.
	return textContent.items as TextItem[];
}

export type SimpleTextItem = {
	value: string,
	arabic: 'true' | 'false',
	x: number,
	y: number,
	width: number,
	height: number,
};

function simplifyTextItem(item: TextItem): SimpleTextItem {
	return {
		value: item.str,
		arabic: item.dir === 'rtl' ? 'true' : 'false',
		x: item.transform[4],
		y: item.transform[5],
		width: item.width,
		height: item.height,
	};
}

export function simplifyTextItems(items: TextItem[]): SimpleTextItem[] {
	return items
		.filter(
			(item) => item.dir !== 'ttb' // Filter all items with 'ttb' direction
				&& item.transform[1] === 0 && item.transform[2] === 0 // or with any skewing/rotation
				&& item.str !== '' && item.transform[4] !== 0 && item.transform[5] !== 0 // or is empty or invisible
		)
		.map(simplifyTextItem);
}

/**
 * Represents a row of sorted items, which can be iterated for each item.
 * 
 * The items are sorted in ascending order by their X coordinates (which is page-left based).
 * 
 * This is essential for the items merging algorithm.
 */
class SortedRow implements Iterable<SimpleTextItem> {

	/**
	 * Construct a new row of items view.
	 * 
	 * @param items The items array to take a section from,
	 * it should be sorted in ascending order by Y coordinates then by X coordinates.
	 * @param fromIndex The index of the first item included in the view section.
	 * @param toIndex The index of the last item included in the view section.
	 */
	constructor(
		private readonly items: readonly Readonly<SimpleTextItem>[],
		private readonly fromIndex: number,
		private readonly toIndex: number
	) { }

	[Symbol.iterator](): Iterator<SimpleTextItem, undefined> {
		let currentIndex = this.fromIndex;

		return {
			next: () => {
				if (currentIndex > this.toIndex) return { done: true };
				return { done: false, value: this.items[currentIndex++] };
			},
		};
	}

}

/**
 * Represents a page of sorted items, which can be iterated for each row of items.
 * 
 * The items rows are sorted in ascending order by their Y coordinates (which is page-bottom based).
 * 
 * This is essential for the items merging algorithm.
 */
class SortedPage implements Iterable<SortedRow> {
	private readonly items: readonly Readonly<SimpleTextItem>[];

	constructor(items: SimpleTextItem[]) {
		// Sort the items in ascending order: first by their Y coordinates, then by their X coordinates.
		this.items = [...items].sort((a, b) => (a.y - b.y) || (a.x - b.x));
	}


	/**
	 * The page can be iterated as rows of items.
	 */
	[Symbol.iterator](): Iterator<SortedRow, undefined> {
		let lastIndex = -1;

		return {
			next: () => {
				if (lastIndex + 1 >= this.items.length) return { done: true };

				/**
				 * The index of the first item included in the range.
				 */
				const fromIndex = lastIndex + 1;
				let rowYCoordinate = this.items[fromIndex].y;

				/**
				 * The index of the last item included in the range.
				 */
				let toIndex = fromIndex;
				while (toIndex < this.items.length - 1 && this.items[toIndex + 1].y === rowYCoordinate) toIndex++;

				lastIndex = toIndex;
				return { done: false, value: new SortedRow(this.items, fromIndex, toIndex) };
			}
		};
	}

}

/**
 * Checks whether the item is protected from being merged with other items or not.
 * 
 * @param item The item to check.
 * @returns Whether the item is protected or not.
 */
function isItemProtected(item: SimpleTextItem): boolean {
	// The students IDs, which are numbers of 5 digits, should be protected from getting merged.
	return item.value.match(/^\d{5}$/) !== null;
}

/**
 * Checks whether 2 items should be merged or not.
 * 
 * @param itemA The first item to check, which should be to the left (lower X coordinates).
 * @param itemB The second item to check, which should be to the right (higher X cordinates).
 * @returns Whether the items should be merged or not.
 */
function shouldBeMerged(itemA: SimpleTextItem, itemB: SimpleTextItem): boolean {
	// Don't merge if:
	if (itemA.height !== itemB.height) return false; // The items don't match in height (font-size).
	if (isItemProtected(itemA) || isItemProtected(itemB)) return false; // Either of the items is protected from being merged.

	const errorTolerance = itemA.height / 10;
	return itemB.x <= itemA.x + itemA.width + errorTolerance;
}

export function mergeCloseSimpleTextItems(items: SimpleTextItem[]): SimpleTextItem[] {
	const mergedItems: SimpleTextItem[] = [];

	const sortedPage = new SortedPage(items);
	for (const sortedRow of sortedPage) {
		let mergedItem: SimpleTextItem | null = null;

		for (const item of sortedRow) {
			if (!mergedItem) mergedItem = { ...item };
			else if (shouldBeMerged(mergedItem, item)) {
				mergedItem.value = item.value + mergedItem.value;
				mergedItem.arabic = mergedItem.arabic === 'true' ? mergedItem.arabic : item.arabic;
				mergedItem.width = item.x + item.width - mergedItem.x;
			} else {
				mergedItems.push(mergedItem);
				mergedItem = { ...item };
			}
		}

		if (mergedItem) mergedItems.push(mergedItem);
	}

	return mergedItems;
}

class TablePage implements Iterable<SimpleTextItem[]> {
	private readonly items: readonly Readonly<SimpleTextItem>[];

	constructor(items: SimpleTextItem[]) {
		this.items = [...items].sort((a, b) =>
			TablePage.doYProjectionsIntersect(a, b) ? b.x - a.x : b.y - a.y
		);
	}

	[Symbol.iterator](): Iterator<SimpleTextItem[], undefined> {
		let lastIndex = -1;

		return {
			next: () => {
				if (lastIndex + 1 >= this.items.length) return { done: true };

				/**
				 * The index of the first item included in the range.
				 */
				const fromIndex = lastIndex + 1;

				/**
				 * The index of the last item included in the range.
				 */
				let toIndex = fromIndex;

				let lastItem = this.items[toIndex];
				while (
					toIndex < this.items.length - 1
					&& TablePage.doYProjectionsIntersect(lastItem, this.items[toIndex + 1])
				) lastItem = this.items[++toIndex];

				lastIndex = toIndex;
				
				const itemsRow = this.items.slice(fromIndex, toIndex + 1).sort((a, b) => b.x - a.x);
				return { done: false, value: itemsRow };
			}
		};
	}

	private static doYProjectionsIntersect(itemA: Readonly<SimpleTextItem>, itemB: Readonly<SimpleTextItem>): boolean {
		if (itemA.y >= itemB.y && itemA.y <= itemB.y + itemB.height) return true;
		if (itemB.y >= itemA.y && itemB.y <= itemA.y + itemA.height) return true;
		return false;
	}

}

export function groupIntoRows(items: SimpleTextItem[]): SimpleTextItem[][] {
	return Array.from(new TablePage(items));
}

export interface MarkRecord {
	studentId: number,

	studentName: string | null,
	studentFatherName: string | null,

	practicalMark: number | null,
	theoreticalMark: number | null,

	examMark: number | null,
}

export function extractMarks(itemsTable: SimpleTextItem[][]): MarkRecord[] {
	const markRecords: MarkRecord[] = [];

	for (const itemsRow of itemsTable) {
		const studentIdItem: SimpleTextItem | undefined = itemsRow[0];

		// Check if it's a valid student ID, it should be a 5 digits number between 10000 and 59999.
		// Otherwise reject the whole row.
		if (!studentIdItem || studentIdItem.arabic !== 'false' || !studentIdItem.value.match(/^[1-5]\d{4}$/)) continue;

		// Create the record.
		const record: MarkRecord = {
			studentId: Number.parseInt(studentIdItem.value),
			studentName: null,
			studentFatherName: null,
			practicalMark: null,
			theoreticalMark: null,
			examMark: null,
		};

		let marks: number[] = [];

		for (const item of itemsRow) {
			if (item === studentIdItem) continue; // Ignore the student id.
			const { value, arabic } = item;

			if (value.length > 255) continue; // Invalid item.

			const isMark = arabic === 'false' && value.match(/^\d{1,3}$/);
			const isArabic = arabic === 'true';

			if (isArabic && marks.length === 0) {
				if (record.studentName === null) record.studentName = value.trim();
				else if (record.studentFatherName === null) record.studentFatherName = value.trim();
			}

			if (isMark && marks.length < 3) marks.push(Number.parseInt(value));
		}

		if (marks.length === 1)
			record.examMark = marks[0];
		else if (marks.length === 3)
			[record.practicalMark, record.theoreticalMark, record.examMark] = marks;

		markRecords.push(record);
	}

	return markRecords;
}
