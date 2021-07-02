import { SimpleTextItem } from './simple-text-item';

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

	constructor(items: readonly Readonly<SimpleTextItem>[]) {
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

/**
 * Merges close Arabic simplified text items into single items.
 * The original list is left unmodified.
 *
 * @param items The list of simplified text items.
 * @returns A new list of the text items after merging close Arabic items.
 */
export function mergeCloseSimpleTextItems(items: readonly Readonly<SimpleTextItem>[]): SimpleTextItem[] {
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