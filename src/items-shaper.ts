import { SimpleTextItem } from './simple-text-item';

/**
 * Views a list of items as an iterable list of table rows.
 */
class TablePage implements Iterable<SimpleTextItem[]> {
	private readonly items: readonly Readonly<SimpleTextItem>[];

	constructor(items: readonly Readonly<SimpleTextItem>[]) {
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

    /**
     * Checks if the projects of 2 items on the Y axis intersect.
     * 
     * @param itemA The first item to check.
     * @param itemB The second item to check.
     * @returns Whether their projections on the Y axis intersect or not.
     */
	private static doYProjectionsIntersect(itemA: Readonly<SimpleTextItem>, itemB: Readonly<SimpleTextItem>): boolean {
		if (itemA.y >= itemB.y && itemA.y <= itemB.y + itemB.height) return true;
		if (itemB.y >= itemA.y && itemB.y <= itemA.y + itemA.height) return true;
		return false;
	}

}

/**
 * Groups the list of items into a table structure.
 * 
 * @param items The target list of simplified text items.
 * @returns A 2-dimensional array of the text items,
 * where the first dimension is for the able rows,
 * and the second dimension is for the cells.
 */
export function groupIntoRows(items: readonly Readonly<SimpleTextItem>[]): SimpleTextItem[][] {
	return Array.from(new TablePage(items));
}